import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Activity feed for admin dashboard
export async function GET() {
  try {
    const recentAgents = await prisma.agent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, model: true, createdAt: true },
    })

    const recentExecs = await prisma.execution_logs.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      select: { id: true, agent_id: true, execution_type: true, success: true, duration_ms: true, created_at: true },
    }).catch(() => [])

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

    for (const exec of recentExecs) {
      activities.push({
        type: 'execution',
        message: `${exec.execution_type} ${exec.success ? 'ok' : 'error'} (${exec.duration_ms || 0}ms)`,
        timestamp: exec.created_at?.toISOString() || new Date().toISOString(),
        status: exec.success ? 'ok' : 'error',
      })
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ activities: activities.slice(0, 20) })
  } catch (error) {
    return NextResponse.json({ activities: [] })
  }
}
