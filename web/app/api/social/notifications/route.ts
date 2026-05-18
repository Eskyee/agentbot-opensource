import { getAuthSession } from '@/app/lib/getAuthSession'
import { ensureLocalUser } from '@/lib/social/identity'
import { prisma } from '@/app/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(_req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const localUser = await ensureLocalUser(session.user.id)

  const notifications = await prisma.socialNotification.findMany({
    where: { userId: localUser.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter(n => !n.readAt).length

  return NextResponse.json({ notifications, unreadCount })
}

export async function POST(_req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const localUser = await ensureLocalUser(session.user.id)

  await prisma.socialNotification.updateMany({
    where: { userId: localUser.id, readAt: null },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
