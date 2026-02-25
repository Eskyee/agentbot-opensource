import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, message, conversationHistory = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get the user's instance to find their OpenClaw agent
    const instanceRes = await fetch(`${BACKEND_API_URL}/api/instance/${userId || session.user.id}`)
    if (!instanceRes.ok) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const instanceData = await instanceRes.json()

    // Forward the message to the OpenClaw agent
    // The agent should have an HTTP endpoint for chat
    const agentUrl = instanceData.url || `http://${instanceData.subdomain}.localhost:3000`
    
    try {
      const chatRes = await fetch(`${agentUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory,
          userId: session.user.id,
          source: 'web',
        }),
      })

      if (!chatRes.ok) {
        // If the agent doesn't have a chat endpoint, return a placeholder response
        return NextResponse.json({
          response: "I'm your OpenClaw agent. I'm currently running but the web chat interface is still being connected. Please chat with me via Telegram for now!",
          status: 'partial',
        })
      }

      const chatData = await chatRes.json()
      return NextResponse.json({
        response: chatData.response || chatData.message || 'No response from agent',
        status: 'success',
      })
    } catch (agentError) {
      // Agent might not be reachable via HTTP, return helpful message
      console.error('Agent chat error:', agentError)
      return NextResponse.json({
        response: `I'm your OpenClaw agent (${instanceData.botUsername || 'agent'}). I'm running but the direct web chat is being set up. You can chat with me on Telegram!`,
        status: 'partial',
        telegramLink: instanceData.botUsername ? `https://t.me/${instanceData.botUsername}` : null,
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Get conversation history from the agent
    const instanceRes = await fetch(`${BACKEND_API_URL}/api/instance/${userId}`)
    if (!instanceRes.ok) {
      return NextResponse.json({ conversations: [] })
    }

    const instanceData = await instanceRes.json()
    const agentUrl = instanceData.url || `http://${instanceData.subdomain}.localhost:3000`

    try {
      const historyRes = await fetch(`${agentUrl}/api/chat/history?userId=${session.user.id}`)
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        return NextResponse.json({ conversations: historyData.conversations || [] })
      }
    } catch {
      // Agent doesn't support history endpoint
    }

    return NextResponse.json({ conversations: [] })
  } catch (error) {
    console.error('Chat history error:', error)
    return NextResponse.json({ conversations: [] })
  }
}
