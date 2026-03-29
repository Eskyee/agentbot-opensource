import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

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
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN
    if (!gatewayToken) {
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
    }

    // OpenAI-compatible REST endpoint on the agent's Gateway
    const gatewayUrl = `https://agentbot-agent-${agent.id}-production.up.railway.app`

    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        model: 'openclaw/default',
        messages: [{ role: 'user', content: message }],
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error(`Gateway chat failed (${response.status}):`, errText)
      return NextResponse.json(
        { error: `Gateway returned ${response.status}` },
        { status: response.status >= 500 ? 502 : response.status }
      )
    }

    const data = await response.json()
    const reply =
      data.choices?.[0]?.message?.content || 'No response from agent'

    return NextResponse.json({
      id: data.id || 'msg_' + Date.now(),
      message,
      agent: agent.name,
      reply,
      model: data.model,
      usage: data.usage,
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

export const dynamic = 'force-dynamic'
