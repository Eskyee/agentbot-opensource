export const dynamic = "force-static"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

const BACKEND_API_URL = getBackendApiUrl()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
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

    const INTERNAL_API_KEY = getInternalApiKey()

    const response = await fetch(`${BACKEND_API_URL}/api/openclaw/instances/${agentId}/stats`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      // Fallback to mock data if backend unavailable
      const stats = {
        agentId,
        messagesProcessed: Math.floor(Math.random() * 10000),
        messagesPerHour: Math.floor(Math.random() * 500),
        averageResponseTime: Math.floor(Math.random() * 2000),
        uptime: Math.floor(Math.random() * 864000),
        successRate: (90 + Math.random() * 10).toFixed(2),
        errorRate: (0 + Math.random() * 10).toFixed(2),
        timestamp: new Date().toISOString(),
      }
      return NextResponse.json({ stats, status: 'mock' })
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
