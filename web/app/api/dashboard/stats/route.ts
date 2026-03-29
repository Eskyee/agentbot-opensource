import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await getAuthSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, plan: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count user's agents
    const agentCount = await prisma.agent.count({
      where: { userId: user.id },
    })

    // Count active agents
    const activeAgentCount = await prisma.agent.count({
      where: { userId: user.id, status: 'active' },
    })

    // Count installed skills across all user's agents
    const userAgents = await prisma.agent.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const agentIds = userAgents.map(a => a.id)
    const skillsCount = agentIds.length > 0
      ? await prisma.installedSkill.count({ where: { agentId: { in: agentIds } } })
      : 0

    // Count scheduled tasks
    const tasksCount = agentIds.length > 0
      ? await prisma.scheduledTask.count({ where: { agentId: { in: agentIds } } })
      : 0

    // Count agents created today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const newAgentsToday = await prisma.agent.count({
      where: {
        userId: user.id,
        createdAt: { gte: todayStart },
      },
    })

    // Plan-based agent limits
    const planLimits: Record<string, number> = {
      free: 1, solo: 1, starter: 1, pro: 3, collective: 3,
      scale: 10, label: 10, enterprise: 100, network: 100,
    }
    const agentLimit = planLimits[user.plan || 'free'] || 1

    return NextResponse.json({
      agents: {
        active: activeAgentCount,
        total: agentCount,
        limit: agentLimit,
        newToday: newAgentsToday,
      },
      skills: {
        installed: skillsCount,
      },
      tasks: {
        total: tasksCount,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({
      agents: { active: 0, total: 0, limit: 1, newToday: 0 },
      skills: { installed: 0 },
      tasks: { total: 0 },
    })
  }
}

export const dynamic = 'force-dynamic';
