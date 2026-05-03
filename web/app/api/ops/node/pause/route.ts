import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const VALID_ACTIONS = ['pause', 'resume', 'drain'] as const
type NodeAction = (typeof VALID_ACTIONS)[number]

const STATUS_MAP: Record<NodeAction, string> = {
  pause: 'paused',
  resume: 'running',
  drain: 'draining',
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { agentId, action } = body as { agentId?: string; action?: NodeAction }

    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 },
      )
    }

    // Find agent by ID or name, scoped to user
    let agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) {
      agent = await prisma.agent.findFirst({
        where: { name: agentId, userId: session.user.id },
      })
    }

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const newStatus = STATUS_MAP[action]

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: { status: newStatus },
      select: { id: true, name: true, status: true },
    })

    return NextResponse.json({
      agentId: updated.name || updated.id,
      status: updated.status,
      action,
    })
  } catch (error) {
    console.error('Node pause error:', error)
    return NextResponse.json({ error: 'Failed to update agent status' }, { status: 500 })
  }
}
