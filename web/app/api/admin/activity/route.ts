import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Recent agents (last 10)
    const recentAgents = await prisma.agent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, model: true, createdAt: true },
    })

    // Recent users (last 10)
    const recentUsers = await prisma.user.findMany({
      take: 10,
      select: { id: true, email: true },
    })

    // Recent executions (last 10)
    const recentExecs = await prisma.execution_logs.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      select: { id: true, agent_id: true, execution_type: true, success: true, duration_ms: true, created_at: true },
    }).catch(() => [])

    // Recent skill installs (last 10)
    const recentSkills = await prisma.installedSkill.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, skillId: true, agentId: true, enabled: true, createdAt: true },
    }).catch(() => [])

    // Build activity feed
    const activities: Array<{
      type: string
      message: string
      timestamp: string
      status?: string
    }> = []

    for (const agent of recentAgents) {
      activities.push({
        type: 'agent_created',
        message: `Agent "${agent.name}" created (${agent.status})`,
        timestamp: agent.createdAt.toISOString(),
        status: agent.status,
      })
    }

    for (const user of recentUsers) {
      activities.push({
        type: 'user_signup',
        message: `User: ${user.email}`,
        timestamp: new Date().toISOString(),
      })
    }

    for (const exec of recentExecs) {
      activities.push({
        type: 'execution',
        message: `${exec.execution_type} ${exec.success ? '✓' : '✗'} (${exec.duration_ms || 0}ms)`,
        timestamp: exec.created_at?.toISOString() || new Date().toISOString(),
        status: exec.success ? 'ok' : 'error',
      })
    }

    for (const skill of recentSkills) {
      activities.push({
        type: 'skill_install',
        message: `Skill ${skill.enabled ? 'installed' : 'removed'} on agent`,
        timestamp: skill.createdAt.toISOString(),
        status: skill.enabled ? 'ok' : 'removed',
      })
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      activities: activities.slice(0, 20),
      counts: {
        agents: recentAgents.length,
        users: recentUsers.length,
        executions: recentExecs.length,
        skillInstalls: recentSkills.length,
      },
    })
  } catch (error) {
    console.error('Activity feed error:', error)
    return NextResponse.json({ activities: [], counts: {} })
  }
}
