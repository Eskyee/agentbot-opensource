import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { readSharedGatewayToken } from '@/app/lib/gateway-token'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'
import { acquireWorkloadSlot, releaseWorkloadSlot, type WorkloadTicket } from '@/app/lib/workload-gate'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'

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
  let workloadTicket: WorkloadTicket | null = null
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = getClientIP(req)
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { message } = await req.json()
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

    const slot = await acquireWorkloadSlot({
      lane: 'gateway_chat',
      userId: user.id,
      ip,
      cost: message.length > 800 ? 2 : 1,
    })
    if (!slot.ok) {
      return NextResponse.json(
        { error: slot.reason, retryAfterSeconds: slot.retryAfterSeconds },
        { status: 429 }
      )
    }
    workloadTicket = slot.ticket

    const gatewayToken = readSharedGatewayToken() || process.env.OPENCLAW_GATEWAY_TOKEN

    if (!gatewayToken) {
      return NextResponse.json({ error: 'No gateway token available' }, { status: 503 })
    }

    // Gateway WebSocket URL
    const runtimeHost = user.openclawUrl
      ? new URL(user.openclawUrl).host
      : `agentbot-agent-${user.openclawInstanceId}-production.up.railway.app`
    const gatewayUrl = `wss://${runtimeHost}`

    const enqueueRes = await fetch(`${getBackendApiUrl()}/api/platform-jobs/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getInternalApiKey()}`,
      },
      body: JSON.stringify({
        userId: user.id,
        agentId: agent.id,
        gatewayUrl: `https://${runtimeHost}`,
        message,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const enqueueBody = await enqueueRes.json()
    if (!enqueueRes.ok || !enqueueBody?.job?.id) {
      return NextResponse.json(
        { error: enqueueBody?.error || 'Failed to queue gateway chat job' },
        { status: enqueueRes.status >= 400 ? enqueueRes.status : 502 }
      )
    }

    return NextResponse.json({
      success: true,
      queued: true,
      jobId: enqueueBody.job.id,
      status: enqueueBody.job.status || 'queued',
      agentId: user.openclawInstanceId,
      agentName: agent?.name || user.openclawInstanceId,
    }, { status: 202 })
  } catch (error) {
    console.error('Gateway chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  } finally {
    await releaseWorkloadSlot(workloadTicket)
  }
}

export const dynamic = 'force-dynamic'
