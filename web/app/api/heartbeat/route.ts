import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { invokeGatewayTool } from '@/app/lib/gateway-proxy'

/**
 * GET /api/heartbeat?agentId=xxx
 * Get heartbeat settings — tries gateway first, falls back to DB.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Try gateway first
  const gwResult = await invokeGatewayTool('cron', { action: 'list' }, session.user.id)
  if (gwResult.ok) {
    const data = typeof gwResult.result === 'string' ? JSON.parse(gwResult.result) : gwResult.result
    const jobs = Array.isArray(data) ? data : data?.jobs || data?.result || []
    const heartbeatJob = jobs.find((j: any) =>
      j.name?.toLowerCase().includes('heartbeat') || j.id?.includes('heartbeat')
    )
    if (heartbeatJob) {
      return NextResponse.json({
        source: 'gateway',
        enabled: heartbeatJob.enabled !== false,
        frequency: heartbeatJob.schedule?.everyMs
          ? `${Math.round(heartbeatJob.schedule.everyMs / 3600000)}h`
          : heartbeatJob.schedule?.expr || 'unknown',
        nextRun: heartbeatJob.nextRun || null,
        lastRun: heartbeatJob.lastRun || null,
      })
    }
  }

  // Fallback: read from DB
  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId')
  if (!agentId) {
    return NextResponse.json({ source: 'db', enabled: false, message: 'No agentId provided' })
  }

  try {
    const memory = await prisma.agentMemory.findUnique({
      where: {
        userId_agentId_key: {
          userId: session.user.id,
          agentId,
          key: 'heartbeat_settings',
        },
      },
    })

    if (!memory) {
      return NextResponse.json({
        source: 'db',
        enabled: true,
        frequency: '30m',
        message: 'Using defaults — gateway heartbeat not configured',
      })
    }

    return NextResponse.json({
      source: 'db',
      ...JSON.parse(memory.value),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch heartbeat settings' }, { status: 500 })
  }
}

/**
 * PUT /api/heartbeat
 * Update heartbeat — writes to gateway via cron, falls back to DB.
 */
export async function PUT(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { agentId, enabled, frequency } = body

  // Convert frequency to ms
  const freqMs: Record<string, number> = {
    '1h': 3600000,
    '2h': 7200000,
    '3h': 10800000,
    '6h': 21600000,
    '12h': 43200000,
    '30m': 1800000,
  }

  // Try updating on gateway
  if (enabled && frequency && freqMs[frequency]) {
    const gwResult = await invokeGatewayTool('cron', {
      action: 'add',
      job: {
        name: 'Heartbeat',
        schedule: { kind: 'every', everyMs: freqMs[frequency] },
        payload: {
          kind: 'systemEvent',
          text: 'Heartbeat check — review emails, calendar, and recent activity.',
        },
        enabled: true,
      },
    }, session.user.id)

    if (gwResult.ok) {
      return NextResponse.json({
        success: true,
        source: 'gateway',
        enabled,
        frequency,
      })
    }
  }

  // Fallback: save to DB
  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 })
  }

  try {
    await prisma.agentMemory.upsert({
      where: {
        userId_agentId_key: {
          userId: session.user.id,
          agentId,
          key: 'heartbeat_settings',
        },
      },
      update: {
        value: JSON.stringify({ enabled, frequency }),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        agentId,
        key: 'heartbeat_settings',
        value: JSON.stringify({ enabled, frequency }),
      },
    })

    return NextResponse.json({
      success: true,
      source: 'db',
      enabled,
      frequency,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update heartbeat settings' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
