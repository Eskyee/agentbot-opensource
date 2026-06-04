/**
 * Bridge server — HTTP polling relay between agentbot.sh and local OpenClaw instances.
 *
 * Multi-user: each user has their own bridge secret stored in the User table.
 * The bridge client polls with the secret, and the server routes messages to
 * the correct user's bridge.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

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

// Per-user message queues (in-memory)
const pendingRequests = new Map<string, PendingRequest>()
const pendingResponses = new Map<string, PendingResponse>()

// Track connected bridges: secret → { userId, lastSeen }
const connectedBridges = new Map<string, { userId: string; lastSeen: number }>()

export { pendingRequests, pendingResponses, connectedBridges }

async function userIdFromSecret(secret: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { bridgeSecret: secret },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (!secret) {
    return NextResponse.json({ error: 'secret required' }, { status: 401 })
  }

  const userId = await userIdFromSecret(secret)
  if (!userId) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  // Update last seen
  connectedBridges.set(secret, { userId, lastSeen: Date.now() })

  // Return the oldest pending request for this user
  let oldest: PendingRequest | null = null
  let oldestKey: string | null = null

  for (const [key, req] of pendingRequests) {
    if (req.userId === userId && (!oldest || req.timestamp < oldest.timestamp)) {
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

  const userId = await userIdFromSecret(secret)
  if (!userId) {
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
