import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

/** GET — returns showcase status for the user's first/primary agent */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agent = await prisma.agent.findFirst({
    where: { userId: session.user.id },
    select: { id: true, name: true, showcaseOptIn: true, showcaseDescription: true },
  })
  if (!agent) return NextResponse.json({ error: 'No agent' }, { status: 404 })

  return NextResponse.json({
    agentId: agent.id,
    name: agent.name,
    showcaseOptIn: agent.showcaseOptIn,
    showcaseDescription: agent.showcaseDescription,
  })
}

/** PATCH — toggle showcase opt-in and optionally set a description */
export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { agentId, showcaseOptIn, showcaseDescription } = body

  // Verify ownership
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: session.user.id },
    select: { id: true },
  })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const updated = await prisma.agent.update({
    where: { id: agentId },
    data: {
      ...(typeof showcaseOptIn === 'boolean' && { showcaseOptIn }),
      ...(typeof showcaseDescription === 'string' && {
        showcaseDescription: showcaseDescription.trim().slice(0, 280) || "",
      }),
    },
    select: { showcaseOptIn: true, showcaseDescription: true },
  })

  return NextResponse.json(updated)
}
