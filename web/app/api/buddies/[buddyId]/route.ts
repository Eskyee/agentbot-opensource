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
      const newXp = buddy.xp + 10
      const newLevel = Math.floor(newXp / 100) + 1
      const updated = await prisma.buddy.update({
        where: { id: buddyId },
        data: {
          energy: Math.min(100, buddy.energy + 20),
          happiness: Math.min(100, buddy.happiness + 10),
          xp: newXp,
          level: newLevel,
          lastFed: new Date(),
        },
      })
      return NextResponse.json({ buddy: updated, leveledUp: newLevel > buddy.level })
    }

    if (action === 'play') {
      const newXp = buddy.xp + 25
      const newLevel = Math.floor(newXp / 100) + 1
      const updated = await prisma.buddy.update({
        where: { id: buddyId },
        data: {
          happiness: Math.min(100, buddy.happiness + 15),
          xp: newXp,
          level: newLevel,
          lastPlayed: new Date(),
        },
      })
      return NextResponse.json({ buddy: updated, leveledUp: newLevel > buddy.level })
    }

    if (action === 'train') {
      if (buddy.energy < 30) {
        return NextResponse.json({ error: 'Not enough energy to train (need 30)' }, { status: 400 })
      }
      const newXp = buddy.xp + 50
      const newLevel = Math.floor(newXp / 100) + 1
      const updated = await prisma.buddy.update({
        where: { id: buddyId },
        data: {
          energy: Math.max(0, buddy.energy - 30),
          happiness: Math.max(0, buddy.happiness - 10),
          xp: newXp,
          level: newLevel,
        },
      })
      return NextResponse.json({ buddy: updated, leveledUp: newLevel > buddy.level })
    }

    if (action === 'rename') {
      const { newName } = body
      if (!newName || typeof newName !== 'string' || newName.trim().length === 0 || newName.length > 30) {
        return NextResponse.json({ error: 'Invalid name (1-30 chars)' }, { status: 400 })
      }
      const updated = await prisma.buddy.update({
        where: { id: buddyId },
        data: { name: newName.trim() },
      })
      return NextResponse.json({ buddy: updated })
    }

    return NextResponse.json({ error: 'Invalid action. Use: feed, play, train, rename' }, { status: 400 })
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
