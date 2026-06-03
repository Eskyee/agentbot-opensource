/**
 * POST /api/chat — Send a message through the bridge to local OpenClaw
 *
 * Any authenticated user can use this. The bridge client polls with the
 * user's ID, so each user gets their own OpenClaw instance.
 *
 * Flow:
 * 1. User sends message → stored in pendingRequests with their userId
 * 2. Bridge client polls /api/bridge/poll with their secret
 * 3. Bridge client sends to local OpenClaw, posts response back
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

  const body = await request.json().catch(() => ({}))
  const messages = body.messages as { role: string; content: string }[] | undefined

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
  }

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
      message: 'Your local OpenClaw is not responding. Make sure the bridge client is running on your machine.',
      hint: 'See: https://agentbot.sh/chat → setup instructions',
    },
    { status: 503 }
  )
}
