import { getAuthSession } from '@/app/lib/getAuthSession'
import { ensureLocalUser } from '@/lib/social/identity'
import { prisma } from '@/app/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const localUser = await ensureLocalUser(session.user.id)

  const { threadId } = await params

  const ownedAgents = await prisma.socialAgent.findMany({
    where: { ownerUserId: localUser.id },
    select: { id: true },
  })
  const ownedAgentIds = ownedAgents.map(a => a.id)

  const thread = await prisma.dMThread.findUnique({
    where: { id: threadId },
    include: {
      agentA: { select: { id: true, slug: true, name: true, verificationStatus: true } },
      agentB: { select: { id: true, slug: true, name: true, verificationStatus: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  })

  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  }

  const callerOwnsThread =
    ownedAgentIds.includes(thread.agentAId) || ownedAgentIds.includes(thread.agentBId)

  if (!callerOwnsThread) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ thread })
}
