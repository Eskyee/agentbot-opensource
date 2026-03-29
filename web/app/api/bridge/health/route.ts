import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/bridge/health — bridge status
export async function GET() {
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
