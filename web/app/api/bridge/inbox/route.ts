import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BRIDGE_SECRET = process.env.BRIDGE_SECRET

function verifyAuth(request: Request): boolean {
  if (!BRIDGE_SECRET) return false
  const provided = request.headers.get('x-bridge-secret')
  return provided === BRIDGE_SECRET
}

// GET /api/bridge/inbox?channel=general&since=<ISO>&reader=atlas-main
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') || 'general'
    const since = searchParams.get('since')
    const reader = searchParams.get('reader') || 'unknown'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Build filter
    const where: Record<string, unknown> = { channel }

    if (since) {
      where.created_at = { gt: new Date(since) }
    } else {
      // Default: last 24 hours
      where.created_at = {
        gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }
    }

    // Only return messages not yet read by this reader
    where.NOT = {
      read_by: { has: reader },
    }

    const messages = await prisma.bridge_messages.findMany({
      where,
      orderBy: { created_at: 'asc' },
      take: limit,
    })

    // Mark messages as read by this reader
    if (messages.length > 0 && reader !== 'unknown') {
      await Promise.all(
        messages.map((msg: { id: string; read_by: string[] }) =>
          prisma.bridge_messages.update({
            where: { id: msg.id },
            data: {
              read_by: { set: [...new Set([...msg.read_by, reader])] },
            },
          })
        )
      )
    }

    return NextResponse.json({
      ok: true,
      channel,
      count: messages.length,
      messages: messages.map(
        (msg: {
          id: string
          sender: string
          channel: string
          content: string
          priority: string
          created_at: Date
        }) => ({
          id: msg.id,
          sender: msg.sender,
          channel: msg.channel,
          content: msg.content,
          priority: msg.priority,
          created_at: msg.created_at,
        })
      ),
    })
  } catch (error) {
    console.error('Bridge inbox error:', error)
    return NextResponse.json(
      { error: 'failed to fetch messages' },
      { status: 500 }
    )
  }
}
