import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/bridge/send — send a message to the bridge
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sender, channel, content, priority } = body

    // Validate
    if (!sender || !content) {
      return NextResponse.json(
        { error: 'sender and content are required' },
        { status: 400 }
      )
    }

    const validSenders = ['atlas-main', 'atlas-agentbot', 'eskyee']
    if (!validSenders.includes(sender)) {
      return NextResponse.json(
        { error: `invalid sender. Must be one of: ${validSenders.join(', ')}` },
        { status: 400 }
      )
    }

    const message = await prisma.bridge_messages.create({
      data: {
        sender,
        channel: channel || 'general',
        content,
        priority: priority || 'normal',
        read_by: [sender], // sender has "read" their own message
      },
    })

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        sender: message.sender,
        channel: message.channel,
        priority: message.priority,
        created_at: message.created_at,
      },
    })
  } catch (error) {
    console.error('Bridge send error:', error)
    return NextResponse.json(
      { error: 'failed to send message' },
      { status: 500 }
    )
  }
}
