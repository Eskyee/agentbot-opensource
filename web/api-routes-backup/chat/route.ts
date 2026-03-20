export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message, topic } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Send message to agent
    // Full implementation would route to OpenClaw backend
    return NextResponse.json({
      id: 'msg_' + Date.now(),
      message,
      topic,
      status: 'sent',
      timestamp: new Date().toISOString(),
      reply: 'Message received by agent'
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json({
      messages: [],
      count: 0
    })
  } catch (error) {
    console.error('Chat history fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
