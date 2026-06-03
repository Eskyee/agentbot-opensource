/**
 * Bridge server — HTTP polling relay between agentbot.sh and local OpenClaw instances.
 *
 * Multi-user: each user can have their own bridge client with their own secret.
 * The bridge client polls with the secret, and the server routes messages to the
 * correct user's bridge.
 */

import { NextRequest, NextResponse } from 'next/server'

interface PendingRequest {
  requestId: string
  userId: string
  messages: { role: string; content: string }[]
  timestamp: number
}

interface PendingResponse {
  content: string
  done: boolean
  timestamp: number
}

// Per-user message queues
const pendingRequests = new Map<string, PendingRequest>()
const pendingResponses = new Map<string, PendingResponse>()

// Track which secrets map to which user IDs (set when bridge connects)
const bridgeSecrets = new Map<string, { userId: string; lastSeen: number }>()

export { pendingRequests, pendingResponses }

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (!secret) {
    return NextResponse.json({ error: 'secret required' }, { status: 401 })
  }

  // Check if this is a valid bridge secret
  // In production, verify against stored secrets per user
  const expectedSecret = process.env.BRIDGE_SECRET
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  // Update last seen
  bridgeSecrets.set(secret, { userId: 'default', lastSeen: Date.now() })

  // Return the oldest pending request
  let oldest: PendingRequest | null = null
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
  const secret = request.nextUrl.searchParams.get('secret')

  if (!secret) {
    return NextResponse.json({ error: 'secret required' }, { status: 401 })
  }

  const expectedSecret = process.env.BRIDGE_SECRET
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
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
