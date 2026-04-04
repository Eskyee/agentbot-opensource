import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import WebSocket from 'ws'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { readSharedGatewayToken } from '@/app/lib/gateway-token'

const GATEWAY_IMAGE_VERSION = DEFAULT_OPENCLAW_VERSION

/**
 * Gateway Chat Proxy
 *
 * Connects to the user's OpenClaw Gateway via WebSocket,
 * sends a chat message, and streams the response back via SSE.
 *
 * POST /api/gateway/chat
 * Body: { message: string, sessionKey?: string }
 * Response: SSE stream with chat events
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message, sessionKey } = await req.json()
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Look up user's agent
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, openclawInstanceId: true, openclawUrl: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (!user.openclawInstanceId) {
      return NextResponse.json({ error: 'No OpenClaw instance found' }, { status: 404 })
    }

    const agent = await prisma.agent.findFirst({
      where: { userId: user.id },
      select: { id: true, name: true, status: true },
    })
    if (!agent) {
      return NextResponse.json({ error: 'No agent found' }, { status: 404 })
    }

    const gatewayToken = readSharedGatewayToken() || process.env.OPENCLAW_GATEWAY_TOKEN

    if (!gatewayToken) {
      return NextResponse.json({ error: 'No gateway token available' }, { status: 503 })
    }

    // Gateway WebSocket URL
    const runtimeHost = user.openclawUrl
      ? new URL(user.openclawUrl).host
      : `agentbot-agent-${user.openclawInstanceId}-production.up.railway.app`
    const gatewayUrl = `wss://${runtimeHost}`

    // Connect to Gateway and send message, collect response
    const reply = await gatewayChat(gatewayUrl, gatewayToken, message, sessionKey || 'main')

    return NextResponse.json({
      success: true,
      reply,
      agentId: user.openclawInstanceId,
      agentName: agent?.name || user.openclawInstanceId,
    })
  } catch (error) {
    console.error('Gateway chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}

/**
 * Minimal Gateway WebSocket chat client.
 *
 * The OpenClaw Gateway protocol:
 * 1. Connect via WebSocket
 * 2. Server sends connect.challenge with nonce
 * 3. Client sends connect request with token auth
 * 4. Server responds with connect.ok
 * 5. Client sends chat.send with message
 * 6. Server streams chat.delta events, then chat.done
 */
function gatewayChat(
  url: string,
  token: string,
  message: string,
  sessionKey: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('Gateway chat timeout (30s)'))
    }, 30000)

    const ws = new WebSocket(url, {
      rejectUnauthorized: false,
      handshakeTimeout: 10000,
    })

    let connectNonce: string | null = null
    let connected = false
    let replyParts: string[] = []
    let reqId = 0

    const nextReqId = () => ++reqId

    ws.on('open', () => {
      // Wait for challenge from server
    })

    ws.on('message', (raw) => {
      let msg: any
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }

      // Handle connect.challenge — server asks us to identify
      if (msg.event === 'connect.challenge') {
        connectNonce = msg.payload?.nonce || null
        const id = nextReqId()

        ws.send(
          JSON.stringify({
            type: 'req',
            id,
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
              scopes: [
                'operator.admin',
                'operator.read',
                'operator.write',
                'operator.approvals',
                'operator.pairing',
              ],
              auth: { token },
            },
          })
        )
        return
      }

      // Handle connect response
      if (msg.type === 'res' && msg.result) {
        connected = true

        // Send chat message
        const chatReqId = nextReqId()
        ws.send(
          JSON.stringify({
            type: 'req',
            id: chatReqId,
            method: 'chat.send',
            params: {
              sessionKey,
              message,
            },
          })
        )
        return
      }

      // Handle connect error
      if (msg.type === 'res' && msg.error) {
        clearTimeout(timeout)
        ws.close()
        reject(new Error(`Gateway auth failed: ${msg.error?.message || msg.error?.code || 'unknown'}`))
        return
      }

      // Handle chat events (streamed response)
      if (msg.type === 'event') {
        if (msg.event === 'chat.delta') {
          const delta = msg.payload?.content || msg.payload?.text || ''
          if (delta) replyParts.push(delta)
        }
        if (msg.event === 'chat.done' || msg.event === 'chat.complete') {
          clearTimeout(timeout)
          ws.close()
          resolve(replyParts.join('') || msg.payload?.content || msg.payload?.text || '')
        }
        if (msg.event === 'chat.error') {
          clearTimeout(timeout)
          ws.close()
          reject(new Error(msg.payload?.message || 'Chat error'))
        }
      }
    })

    ws.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`WebSocket error: ${err.message}`))
    })

    ws.on('close', (code, reason) => {
      clearTimeout(timeout)
      if (!connected && !replyParts.length) {
        reject(new Error(`Gateway closed before connect (${code}): ${reason}`))
      } else if (replyParts.length) {
        // Partial response — resolve what we have
        resolve(replyParts.join(''))
      }
    })
  })
}

export const dynamic = 'force-dynamic'
