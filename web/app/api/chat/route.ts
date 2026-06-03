/**
 * POST /api/chat — Send a message through the bridge to local OpenClaw
 *
 * Uses HTTP polling (Vercel-compatible, no WebSocket needed).
 *
 * Flow:
 * 1. User sends message → stored in pendingRequests
 * 2. Bridge client polls /api/bridge/poll, picks up the request
 * 3. Bridge client sends to local OpenClaw, posts response to /api/bridge/poll
 * 4. This endpoint polls for the response and returns it
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { pendingRequests, pendingResponses } from '@/app/api/bridge/poll/route'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin only
  const adminEmails = ['eskyjunglelab@gmail.com', 'djescaba@icloud.com', 'admin@agentbot.sh']
  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const messages = body.messages as { role: string; content: string }[] | undefined

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
  }

  // Check if bridge has been active recently (bridge client polls every 3s)
  const bridgeActive = Array.from(pendingResponses.values()).some(r => Date.now() - r.timestamp < 30_000)
    || Array.from(pendingRequests.values()).some(r => Date.now() - r.timestamp < 30_000)

  // Generate request ID
  const requestId = crypto.randomUUID()

  // Store the request for bridge client to pick up
  pendingRequests.set(requestId, {
    requestId,
    userId: session.user.id,
    messages: messages.slice(-20),
    timestamp: Date.now(),
  })

  // Wait for response (poll every 500ms, timeout 60s)
  const timeout = 60_000
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const resp = pendingResponses.get(requestId)
    if (resp && resp.done) {
      pendingResponses.delete(requestId)
      return NextResponse.json({ reply: resp.content })
    }

    await new Promise(r => setTimeout(r, 500))
  }

  // Timeout — clean up
  pendingRequests.delete(requestId)
  pendingResponses.delete(requestId)

  return NextResponse.json(
    {
      error: 'bridge_offline',
      message: 'Your local OpenClaw is not responding. Make sure the bridge client is running.',
      hint: 'Run: node ~/.openclaw/bridge/client.js',
    },
    { status: 503 }
  )
}
