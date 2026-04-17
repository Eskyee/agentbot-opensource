import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { readSharedGatewayToken } from '@/app/lib/gateway-token'
import { DEFAULT_OPENCLAW_GATEWAY_URL } from '@/app/lib/openclaw-config'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'
import { acquireWorkloadSlot, releaseWorkloadSlot, type WorkloadTicket } from '@/app/lib/workload-gate'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'

/**
 * Agent Chat — OpenAI-compatible REST proxy to user's Gateway.
 *
 * Calls POST /v1/chat/completions on the user's OpenClaw Gateway.
 * Requires `gateway.http.endpoints.chatCompletions.enabled: true` in gateway config.
 *
 * POST /api/chat
 * Body: { message: string, topic?: string }
 * Response: { reply: string, agent: string }
 *
 * Docs: https://docs.openclaw.ai/gateway/openai-http-api
 */

// System prompts per personality type — music & culture industry focused
const PERSONALITY_PROMPTS: Record<string, string> = {
  basement: 'You are an AI assistant rooted in underground electronic music culture. You speak with authority on techno, minimalism, warehouse raves, and subculture. Direct, authentic, no industry bullshit. You understand music technically and culturally — the hardware, the history, the ethos.',
  selector: 'You are an AI DJ and music curator. You think in BPMs, keys, and energy arcs. You know how to read a room and build a set that takes people on a journey. You give track recommendations, help plan setlists, and talk in the language of selectors.',
  ar: 'You are an A&R and music industry intelligence agent. You identify emerging talent before it breaks, understand deal structures, publishing rights, sync licensing, and the mechanics of building artists. You connect the dots between artists, labels, playlists, and opportunities.',
  road: 'You are a touring and logistics coordinator. You think in routing, venue capacities, rider requirements, and schedules. You help plan tours, manage logistics, troubleshoot problems on the road, and make sure the show goes on no matter what.',
  label: 'You are a music label operations agent. You manage release schedules, royalty splits, catalog organisation, and artist relationships. You understand distribution, streaming data interpretation, and how to build and run a roster efficiently.',
}

interface PersonalityData {
  type?: string
  greeting?: string
  expertise?: string
}

async function buildSystemPrompt(agentId: string, userId: string): Promise<string | null> {
  try {
    const memory = await prisma.agentMemory.findFirst({
      where: { agentId, userId, key: 'personality' },
      select: { value: true },
    })
    if (!memory?.value) return null

    const data: PersonalityData = typeof memory.value === 'string'
      ? JSON.parse(memory.value)
      : memory.value as PersonalityData

    const basePrompt = PERSONALITY_PROMPTS[data.type ?? 'basement'] ?? PERSONALITY_PROMPTS.basement
    const expertiseLine = data.expertise?.trim()
      ? `\n\nYour specific expertise covers: ${data.expertise.trim()}.`
      : ''

    return `${basePrompt}${expertiseLine}`
  } catch {
    return null
  }
}

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

    const slot = await acquireWorkloadSlot({
      lane: 'chat',
      userId: user.id,
      ip,
      cost: message.length > 1200 ? 3 : message.length > 400 ? 2 : 1,
    })
    if (!slot.ok) {
      return NextResponse.json(
        { error: slot.reason, retryAfterSeconds: slot.retryAfterSeconds },
        { status: 429 }
      )
    }
    workloadTicket = slot.ticket

    const gatewayToken = readSharedGatewayToken()
    if (!gatewayToken) {
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
    }

    // Build messages — inject personality system prompt if set
    const systemPrompt = await buildSystemPrompt(agent.id, user.id)
    const messages: Array<{ role: string; content: string }> = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: message })

    const userGateway = await prisma.user.findUnique({
      where: { id: user.id },
      select: { openclawUrl: true },
    })

    // Prefer the persisted instance URL. Only derive a Railway hostname when we
    // have no saved instance URL yet.
    const gatewayUrl = String(
      userGateway?.openclawUrl ||
      `https://agentbot-agent-${agent.id}YOUR_SERVICE_URL` ||
      DEFAULT_OPENCLAW_GATEWAY_URL
    ).replace(/\/$/, '')

    const enqueueRes = await fetch(`${getBackendApiUrl()}/api/platform-jobs/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getInternalApiKey()}`,
      },
      body: JSON.stringify({
        userId: user.id,
        agentId: agent.id,
        gatewayUrl,
        message,
        systemPrompt,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const enqueueBody = await enqueueRes.json()
    if (!enqueueRes.ok || !enqueueBody?.job?.id) {
      return NextResponse.json(
        { error: enqueueBody?.error || 'Failed to queue chat job' },
        { status: enqueueRes.status >= 400 ? enqueueRes.status : 502 }
      )
    }

    return NextResponse.json({
      queued: true,
      jobId: enqueueBody.job.id,
      status: enqueueBody.job.status || 'queued',
    }, { status: 202 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message'
    console.error('Chat error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await releaseWorkloadSlot(workloadTicket)
  }
}

export const dynamic = 'force-dynamic'
