/**
 * Bridge server — HTTP polling relay between agentbot.sh and local OpenClaw.
 *
 * Uses polling instead of WebSocket for Vercel compatibility (no WebSocketPair needed).
 *
 * Flow:
 * 1. Local bridge client polls /api/bridge/poll for pending messages
 * 2. User sends message to /api/chat (authenticated)
 * 3. Server stores message in pending queue
 * 4. Bridge client picks it up, sends to local OpenClaw, posts response back
 * 5. Chat endpoint polls for the response and returns it to the user
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory message queues (survives as long as the serverless function is warm)
const pendingRequests = new Map<string, {
  requestId: string
  userId: string
  messages: { role: string; content: string }[]
  timestamp: number
}>()

const pendingResponses = new Map<string, {
  content: string
  done: boolean
  timestamp: number
}>()

export { pendingRequests, pendingResponses }

export async function GET(request: NextRequest) {
  // Bridge client polls this to get pending messages
  const secret = request.nextUrl.searchParams.get('secret')

  if (!secret || secret !== process.env.BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return the oldest pending request
  let oldest: { requestId: string; userId: string; messages: { role: string; content: string }[]; timestamp: number } | null = null
  let oldestKey: string | null = null

  for (const [key, req] of pendingRequests) {
    if (!oldest || req.timestamp < oldest.timestamp) {
      oldest = req
      oldestKey = key
    }
  }

  if (oldest && oldestKey) {
    return NextResponse.json({
      type: 'chat',
      requestId: oldest.requestId,
      messages: oldest.messages,
    })
  }

  return NextResponse.json({ type: 'idle' })
}

export async function POST(request: NextRequest) {
  // Bridge client posts responses here
  const secret = request.nextUrl.searchParams.get('secret')

  if (!secret || secret !== process.env.BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { requestId, content, done } = body as { requestId?: string; content?: string; done?: boolean }

  if (!requestId) {
    return NextResponse.json({ error: 'requestId required' }, { status: 400 })
  }

  // Store the response
  const existing = pendingResponses.get(requestId)
  pendingResponses.set(requestId, {
    content: existing ? existing.content + (content || '') : (content || ''),
    done: done !== false,
    timestamp: Date.now(),
  })

  // Remove from pending requests if done
  if (done !== false) {
    pendingRequests.delete(requestId)
  }

  return NextResponse.json({ ok: true })
}
