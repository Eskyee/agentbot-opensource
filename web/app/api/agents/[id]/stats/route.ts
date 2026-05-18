import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params

    // Ownership check
    const ownedAgent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id }
    })
    if (!ownedAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const BACKEND_API_URL = getBackendApiUrl()
    const INTERNAL_API_KEY = getInternalApiKey()

    const response = await fetch(`${BACKEND_API_URL}/api/openclaw/instances/${agentId}/stats`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Agent stats temporarily unavailable',
          stats: {
            agentId,
            cpu: null,
            memory: null,
            memoryPercent: null,
            network: null,
            uptime: null,
            uptimeFormatted: null,
            status: 'degraded',
            pids: null,
            messagesProcessed: null,
            messagesPerHour: null,
            averageResponseTime: null,
            successRate: null,
            errorRate: null,
          },
          status: 'degraded',
        },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      stats: {
        agentId: data.agentId,
        cpu: data.cpu,
        memory: data.memory,
        memoryPercent: data.memoryPercent,
        network: data.network,
        uptime: data.uptime,
        uptimeFormatted: data.uptimeFormatted,
        status: data.status,
        pids: data.pids,
        messagesProcessed: 'N/A',
        messagesPerHour: 'N/A',
        averageResponseTime: 'N/A',
        successRate: 'N/A',
        errorRate: 'N/A',
      },
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch agent stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent stats' },
      { status: 500 }
    )
  }
}


