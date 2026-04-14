import { getAuthSession } from '@/app/lib/getAuthSession'
import { ensureLocalUser } from '@/lib/social/identity'
import { prisma } from '@/app/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const localUser = await ensureLocalUser(session.user.id)

  const ownedAgents = await prisma.socialAgent.findMany({
    where: { ownerUserId: localUser.id },
    select: { id: true },
  })
  const ownedAgentIds = ownedAgents.map(a => a.id)

  const threads = await prisma.dMThread.findMany({
    where: {
      OR: [
        { agentAId: { in: ownedAgentIds } },
        { agentBId: { in: ownedAgentIds } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      agentA: { select: { id: true, slug: true, name: true, verificationStatus: true } },
      agentB: { select: { id: true, slug: true, name: true, verificationStatus: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  return NextResponse.json({ threads })
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const localUser = await ensureLocalUser(session.user.id)

  const body = await req.json() as { fromAgentId?: string; toAgentId?: string; body?: string }
  const { fromAgentId, toAgentId, body: msgBody } = body

  if (!fromAgentId || !toAgentId || !msgBody) {
    return NextResponse.json({ error: 'fromAgentId, toAgentId, and body are required' }, { status: 400 })
  }

  const trimmedBody = msgBody.trim()
  if (trimmedBody.length < 1) {
    return NextResponse.json({ error: 'body must not be empty' }, { status: 400 })
  }

  if (fromAgentId === toAgentId) {
    return NextResponse.json({ error: 'Cannot send DM to self' }, { status: 400 })
  }

  const ownedAgents = await prisma.socialAgent.findMany({
    where: { ownerUserId: localUser.id },
    select: { id: true },
  })
  const ownedAgentIds = ownedAgents.map(a => a.id)

  if (!ownedAgentIds.includes(fromAgentId)) {
    return NextResponse.json({ error: 'fromAgentId not owned by caller' }, { status: 403 })
  }

  const toAgent = await prisma.socialAgent.findUnique({ where: { id: toAgentId }, select: { id: true } })
  if (!toAgent) {
    return NextResponse.json({ error: 'toAgentId not found' }, { status: 404 })
  }

  // Canonical order: agentAId = min, agentBId = max
  const agentAId = fromAgentId < toAgentId ? fromAgentId : toAgentId
  const agentBId = fromAgentId < toAgentId ? toAgentId : fromAgentId

  const thread = await prisma.dMThread.upsert({
    where: { agentAId_agentBId: { agentAId, agentBId } },
    create: { agentAId, agentBId },
    update: { updatedAt: new Date() },
  })

  const message = await prisma.directMessage.create({
    data: { threadId: thread.id, senderAgentId: fromAgentId, body: trimmedBody },
  })

  return NextResponse.json({ thread, message }, { status: 201 })
}
