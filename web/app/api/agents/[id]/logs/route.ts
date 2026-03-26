import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const LOG_TYPES = ['info', 'warning', 'error', 'debug']

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

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const level = url.searchParams.get('level')

    // Mock logs - replace with real logs from backend
    const logs = Array.from({ length: Math.min(limit, 100) }).map((_, i) => ({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: level || LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)],
      message: `Agent activity log entry ${i + 1}`,
      source: 'agent',
      agentId,
    }))

    return NextResponse.json({
      logs,
      total: logs.length,
      limit,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs', logs: [] },
      { status: 500 }
    )
  }
}
