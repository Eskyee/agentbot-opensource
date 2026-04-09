import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BRIDGE_SECRET = process.env.BRIDGE_SECRET

function verifyAuth(request: Request): boolean {
  if (!BRIDGE_SECRET) return true
  const provided = request.headers.get('x-bridge-secret')
  return provided === BRIDGE_SECRET
}

// GET /api/bridge/health — bridge status
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    // Quick DB check
    const count = await prisma.bridge_messages.count()

    // Get last message timestamp
    const last = await prisma.bridge_messages.findFirst({
      orderBy: { created_at: 'desc' },
      select: { created_at: true, sender: true, channel: true },
    })

    return NextResponse.json({
      status: 'ok',
      total_messages: count,
      last_message: last || null,
      channels: ['general', 'tasks', 'alerts'],
      senders: ['atlas-main', 'atlas-agentbot', 'eskyee'],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Bridge health error:', error)
    return NextResponse.json(
      { status: 'error', error: 'database unreachable' },
      { status: 500 }
    )
  }
}
// bridge auth env var trigger
// re-add env trigger 1774820686
