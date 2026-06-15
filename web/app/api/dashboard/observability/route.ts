import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const period = req.nextUrl.searchParams.get('period') || '7d'
  const statsOnly = req.nextUrl.searchParams.get('stats') === 'true'
  const days = period === '30d' ? 30 : 7

  try {
    // Try to get real traces from backend
    let traces: unknown[] = []
    let stats = {
      totalTraces: 0,
      avgDuration: 0,
      totalTokens: 0,
      totalCost: 0,
      errorRate: 0,
      topErrors: [] as { message: string; count: number }[],
    }

    try {
      const API_URL = getBackendApiUrl()
      const API_KEY = getInternalApiKey()
      if (API_URL && API_KEY) {
        const [tracesRes, statsRes] = await Promise.all([
          fetch(
            `${API_URL}/api/metrics/traces?userId=${session.user.id}&days=${days}${statsOnly ? '&stats=true' : ''}`,
            { headers: { Authorization: `Bearer ${API_KEY}` }, signal: AbortSignal.timeout(5000) }
          ),
          statsOnly ? Promise.resolve(null) : fetch(
            `${API_URL}/api/metrics/traces/stats?userId=${session.user.id}&days=${days}`,
            { headers: { Authorization: `Bearer ${API_KEY}` }, signal: AbortSignal.timeout(5000) }
          ),
        ])

        if (tracesRes.ok) {
          const data = await tracesRes.json()
          traces = data.traces ?? data ?? []
          if (data.stats) stats = data.stats
        }
        if (statsRes?.ok) {
          stats = await statsRes.json()
        }
      }
    } catch {
      // Backend not available — build from audit logs
    }

    // Fallback: build traces from audit logs + agent data
    if (traces.length === 0 && !statsOnly) {
      const agents = await prisma.agent.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true, status: true, updatedAt: true },
      })

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { agent: { select: { name: true } } },
      })

      // Build synthetic traces from audit logs
      traces = auditLogs.slice(0, 20).map((log) => ({
        id: log.id,
        agentId: log.agentId ?? 'system',
        agentName: log.agent?.name ?? 'System',
        trigger: log.action,
        status: 'completed',
        totalDuration: null,
        totalTokens: 0,
        totalCost: 0,
        steps: [{
          id: `${log.id}-step`,
          type: log.category === 'config' ? 'decision' : log.category,
          name: log.detail ?? log.action,
          duration: null,
          tokens: null,
          cost: null,
          status: 'success',
          detail: log.detail,
          timestamp: log.createdAt.toISOString(),
        }],
        startedAt: log.createdAt.toISOString(),
        completedAt: log.createdAt.toISOString(),
      }))

      stats = {
        totalTraces: traces.length,
        avgDuration: 0,
        totalTokens: 0,
        totalCost: 0,
        errorRate: 0,
        topErrors: [],
      }
    }

    if (statsOnly) {
      return NextResponse.json(stats)
    }

    return NextResponse.json(traces)
  } catch (error) {
    console.error('[Observability API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch observability data' },
      { status: 500 }
    )
  }
}
