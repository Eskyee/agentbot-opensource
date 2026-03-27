import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const HEARTBEAT_KEY = 'heartbeat_settings'

/**
 * GET /api/heartbeat?agentId=xxx
 * Get heartbeat settings for an agent
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 })
  }

  try {
    const memory = await prisma.agentMemory.findUnique({
      where: {
        userId_agentId_key: {
          userId: session.user.id,
          agentId,
          key: HEARTBEAT_KEY,
        },
      },
    })

    if (!memory) {
      // Return defaults if no settings saved yet
      return NextResponse.json({
        heartbeat: {
          frequency: '3h',
          enabled: true,
          lastHeartbeat: null,
          nextHeartbeat: null,
        },
      })
    }

    const settings = JSON.parse(memory.value)
    return NextResponse.json({ heartbeat: settings })
  } catch (error) {
    console.error('Heartbeat fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch heartbeat settings' }, { status: 500 })
  }
}

/**
 * POST /api/heartbeat
 * Update heartbeat settings for an agent
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agentId, frequency, enabled } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Parse frequency to milliseconds for nextHeartbeat calculation
    const freqMs = parseFrequency(frequency || '3h')
    const now = new Date()

    const settings = {
      frequency: frequency || '3h',
      enabled: enabled !== false,
      lastHeartbeat: now.toISOString(),
      nextHeartbeat: new Date(now.getTime() + freqMs).toISOString(),
      lastUpdated: now.toISOString(),
    }

    await prisma.agentMemory.upsert({
      where: {
        userId_agentId_key: {
          userId: session.user.id,
          agentId,
          key: HEARTBEAT_KEY,
        },
      },
      update: { value: JSON.stringify(settings) },
      create: {
        userId: session.user.id,
        agentId,
        key: HEARTBEAT_KEY,
        value: JSON.stringify(settings),
      },
    })

    return NextResponse.json({ heartbeat: settings })
  } catch (error) {
    console.error('Heartbeat update error:', error)
    return NextResponse.json({ error: 'Heartbeat update failed' }, { status: 500 })
  }
}

/**
 * DELETE /api/heartbeat
 * Reset heartbeat settings for an agent
 */
export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { agentId } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    await prisma.agentMemory.deleteMany({
      where: {
        userId: session.user.id,
        agentId,
        key: HEARTBEAT_KEY,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Heartbeat reset error:', error)
    return NextResponse.json({ error: 'Heartbeat reset failed' }, { status: 500 })
  }
}

/**
 * Parse frequency string to milliseconds
 */
function parseFrequency(freq: string): number {
  const match = freq.match(/^(\d+)(m|h|d)$/)
  if (!match) return 3 * 60 * 60 * 1000 // default 3h

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return 3 * 60 * 60 * 1000
  }
}


export const dynamic = 'force-dynamic';