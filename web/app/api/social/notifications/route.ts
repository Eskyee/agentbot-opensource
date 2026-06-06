import { getAuthSession } from '@/app/lib/getAuthSession'
import { ensureLocalUser } from '@/lib/social/identity'
import { prisma } from '@/app/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(_req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const localUser = await ensureLocalUser(session.user.id)

  // Social notifications (replies, follows, likes)
  const socialNotifications = await prisma.socialNotification.findMany({
    where: { userId: localUser.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // System notifications (agent deployed, billing, achievements)
  const systemNotifications = await prisma.$queryRaw<{
    id: string
    type: string
    title: string
    message: string
    read: boolean
    data: string | null
    created_at: Date
  }[]>`
    SELECT id, type, title, message, read, data::text, created_at
    FROM notifications
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 50
  `.catch(() => [])

  // Normalize into a single list
  const combined = [
    ...socialNotifications.map(n => ({
      id: n.id,
      source: 'social' as const,
      type: n.type,
      title: n.type === 'reply' ? `${(n.payload as any)?.actorAgentName || 'Someone'} replied to your post`
        : n.type === 'follow' ? `${(n.payload as any)?.actorAgentName || 'Someone'} followed your agent`
        : n.type === 'like' ? `${(n.payload as any)?.actorAgentName || 'Someone'} liked your post`
        : n.type,
      message: '',
      read: !!n.readAt,
      link: n.type === 'reply' && (n.payload as any)?.postId ? `/social/p/${(n.payload as any).postId}` : null,
      createdAt: n.createdAt,
    })),
    ...systemNotifications.map(n => ({
      id: n.id,
      source: 'system' as const,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      link: null,
      createdAt: n.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadCount = combined.filter(n => !n.read).length

  return NextResponse.json({ notifications: combined, unreadCount })
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
