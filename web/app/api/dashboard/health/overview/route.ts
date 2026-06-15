import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

interface AgentHealthData {
  id: string
  name: string
  status: string
  model: string | null
  lastActive: string | null
  uptime: number | null
  errorRate: number
  tokensUsed: number
  costToday: number
  callsToday: number
  skills: number
  tasks: number
  tasksEnabled: number
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, plan: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch agents with related counts
    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            installedSkills: true,
            scheduledTasks: true,
          },
        },
        scheduledTasks: {
          select: { enabled: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Try to get real-time metrics from backend
    let backendMetrics: Record<string, {
      tokens?: number
      cost?: number
      calls?: number
      errors?: number
      errorRate?: number
      lastActive?: string
    }> = {}

    try {
      const API_URL = getBackendApiUrl()
      const API_KEY = getInternalApiKey()
      if (API_URL && API_KEY) {
        const res = await fetch(
          `${API_URL}/api/metrics/health?userId=${user.id}`,
          {
            headers: { Authorization: `Bearer ${API_KEY}` },
            signal: AbortSignal.timeout(5000),
          }
        )
        if (res.ok) {
          const data = await res.json()
          backendMetrics = data.agents ?? {}
        }
      }
    } catch {
      // Backend not available
    }

    // Build per-agent health
    const agentHealth: AgentHealthData[] = agents.map((agent) => {
      const bm = backendMetrics[agent.id] ?? {}
      return {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        model: agent.model,
        lastActive: bm.lastActive ?? agent.updatedAt?.toISOString() ?? null,
        uptime: null,
        errorRate: bm.errorRate ?? 0,
        tokensUsed: bm.tokens ?? 0,
        costToday: bm.cost ?? 0,
        callsToday: bm.calls ?? 0,
        skills: agent._count.installedSkills,
        tasks: agent._count.scheduledTasks,
        tasksEnabled: agent.scheduledTasks.filter((t) => t.enabled).length,
      }
    })

    // Totals
    const totalAgents = agentHealth.length
    const activeAgents = agentHealth.filter(
      (a) => a.status === 'active' || a.status === 'running'
    ).length
    const totalTokens = agentHealth.reduce((s, a) => s + a.tokensUsed, 0)
    const totalCost = agentHealth.reduce((s, a) => s + a.costToday, 0)
    const totalCalls = agentHealth.reduce((s, a) => s + a.callsToday, 0)
    const totalErrors = agentHealth.reduce(
      (s, a) => s + Math.round(a.errorRate * a.callsToday),
      0
    )
    const avgErrorRate = totalCalls > 0 ? totalErrors / totalCalls : 0

    // Gateway status
    let gateway: {
      status: string
      sessions: { active: number; total: number }
      cron: { enabled: number; total: number }
    } | null = null

    try {
      const gatewayRes = await fetch('/api/gateway/status', {
        signal: AbortSignal.timeout(5000),
      })
      if (gatewayRes.ok) {
        const gw = await gatewayRes.json()
        gateway = {
          status: gw.health ?? 'unknown',
          sessions: gw.sessions ?? { active: 0, total: 0 },
          cron: gw.cron ?? { enabled: 0, total: 0 },
        }
      }
    } catch {
      // Gateway not reachable
    }

    return NextResponse.json(
      {
        agents: agentHealth,
        totals: {
          totalAgents,
          activeAgents,
          totalTokens,
          totalCost,
          totalCalls,
          totalErrors,
          avgErrorRate,
        },
        gateway,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'max-age=15, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('[Health Overview API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    )
  }
}
