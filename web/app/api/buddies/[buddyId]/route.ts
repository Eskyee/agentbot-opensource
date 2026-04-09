import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ buddyId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { buddyId } = await params

  const buddy = await prisma.buddy.findFirst({
    where: { id: buddyId, userId: session.user.id },
  })

  if (!buddy) {
    return NextResponse.json({ error: 'Buddy not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'feed') {
      const updated = await prisma.buddy.update({
        where: { id: buddyId },
        data: {
          energy: Math.min(100, buddy.energy + 20),
          happiness: Math.min(100, buddy.happiness + 10),
          xp: buddy.xp + 10,
          lastFed: new Date(),
        },
      })
      return NextResponse.json({ buddy: updated })
    }

    if (action === 'play') {
      const updated = await prisma.buddy.update({
        where: { id: buddyId },
        data: {
          happiness: Math.min(100, buddy.happiness + 15),
          xp: buddy.xp + 25,
          lastPlayed: new Date(),
        },
      })
      return NextResponse.json({ buddy: updated })
    }

    return NextResponse.json({ error: 'Invalid action. Use: feed, play' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ buddyId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { buddyId } = await params

  const buddy = await prisma.buddy.findFirst({
    where: { id: buddyId, userId: session.user.id },
  })

  if (!buddy) {
    return NextResponse.json({ error: 'Buddy not found' }, { status: 404 })
  }

  await prisma.buddy.delete({ where: { id: buddyId } })

  return NextResponse.json({ success: true })
}
