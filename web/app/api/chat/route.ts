import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import WebSocket from 'ws'
import { logUsage } from '@/lib/usage-logger'

const GATEWAY_IMAGE_VERSION = '2026.3.24'

/**
 * Agent Chat — proxy to user's OpenClaw Gateway via WebSocket.
 *
 * POST /api/chat
 * Body: { message: string, topic?: string }
 * Response: { reply: string, id: string, agent: string }
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message, topic } = await req.json()
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const agent = await prisma.agent.findFirst({
      where: { userId: user.id },
      select: { id: true, name: true },
    })
    if (!agent) {
      return NextResponse.json({ error: 'No agent deployed' }, { status: 404 })
    }

    // Get gateway token
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN
    if (!gatewayToken) {
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
    }

    const gatewayUrl = `wss://agentbot-agent-${agent.id}-production.up.railway.app`

    // Send message to Gateway and get reply
    const reply = await gatewayChat(gatewayUrl, gatewayToken, message, topic || 'main')

    // Log usage (fire-and-forget)
    try {
      logUsage({
        userId: user.id,
        agentId: agent.id,
        model: 'gateway',
        inputTokens: 0,
        outputTokens: 0,
        endpoint: '/api/chat',
        success: true,
      })
    } catch { /* best-effort */ }

    return NextResponse.json({
      id: 'msg_' + Date.now(),
      message,
      agent: agent.name,
      reply,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}

function gatewayChat(
  url: string,
  token: string,
  message: string,
  sessionKey: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Agent response timeout (30s)'))
    }, 30000)

    const ws = new WebSocket(url, {
      rejectUnauthorized: false,
      handshakeTimeout: 10000,
    })

    let connected = false
    let replyParts: string[] = []
    let reqId = 0

    ws.on('open', () => {
      // Wait for connect.challenge from server
    })

    ws.on('message', (raw) => {
      let msg: any
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }

      if (msg.event === 'connect.challenge') {
        ws.send(
          JSON.stringify({
            type: 'req',
            id: ++reqId,
            method: 'connect',
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: 'openclaw-control-ui',
                version: GATEWAY_IMAGE_VERSION,
                platform: 'web',
                mode: 'webchat',
              },
              role: 'operator',
              scopes: ['operator.admin', 'operator.read', 'operator.write'],
              auth: { token },
            },
          })
        )
        return
      }

      if (msg.type === 'res' && msg.result && !connected) {
        connected = true
        ws.send(
          JSON.stringify({
            type: 'req',
            id: ++reqId,
            method: 'chat.send',
            params: { sessionKey, message },
          })
        )
        return
      }

      if (msg.type === 'res' && msg.error) {
        clearTimeout(timeout)
        ws.close()
        reject(new Error(msg.error?.message || 'Gateway auth failed'))
        return
      }

      if (msg.type === 'event') {
        if (msg.event === 'chat.delta') {
          const delta = msg.payload?.content || msg.payload?.text || ''
          if (delta) replyParts.push(delta)
        }
        if (msg.event === 'chat.done' || msg.event === 'chat.complete') {
          clearTimeout(timeout)
          ws.close()
          resolve(replyParts.join('') || msg.payload?.content || msg.payload?.text || 'No response')
        }
      }
    })

    ws.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`Connection error: ${err.message}`))
    })

    ws.on('close', (code) => {
      clearTimeout(timeout)
      if (replyParts.length > 0) {
        resolve(replyParts.join(''))
      } else if (!connected) {
        reject(new Error(`Gateway connection failed (${code})`))
      }
    })
  })
}

export const dynamic = 'force-dynamic'
