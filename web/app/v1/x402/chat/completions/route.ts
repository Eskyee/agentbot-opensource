import { NextRequest, NextResponse } from 'next/server'
import { resolveGatewayUpstreams, normalizeGatewayModel, recordGatewayUsage } from '@/app/lib/opengateway'

export const runtime = 'nodejs'

/**
 * x402-protected chat completions endpoint.
 * Payment is handled by middleware.ts — if we reach here, payment is verified.
 * Proxies to MiMo direct upstream (or fallback).
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  let body: {
    model?: string
    messages?: Array<{ role: string; content: string }>
    stream?: boolean
    max_tokens?: number
    temperature?: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const model = body.model || 'mimo-v2.5-pro'
  const messages = body.messages || []

  if (!messages.length) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
  }

  // Resolve upstreams — MiMo direct first, OpenRouter fallback
  const upstreams = resolveGatewayUpstreams()
  if (!upstreams.length) {
    return NextResponse.json(
      { error: 'No upstream provider configured' },
      { status: 503 }
    )
  }

  const stream = body.stream ?? false

  // Try each upstream
  for (const upstream of upstreams) {
    const upstreamModel = normalizeGatewayModel(model, upstream.provider)
    const url = `${upstream.baseUrl}/chat/completions`

    try {
      const upstreamRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${upstream.apiKey}`,
          ...(upstream.headers || {}),
        },
        body: JSON.stringify({
          model: upstreamModel,
          messages,
          stream,
          max_tokens: body.max_tokens ?? 4096,
          temperature: body.temperature,
        }),
        signal: AbortSignal.timeout(60_000),
      })

      if (!upstreamRes.ok) {
        const errText = await upstreamRes.text().catch(() => '')
        console.error(`[x402] upstream ${upstream.provider} returned ${upstreamRes.status}: ${errText.slice(0, 200)}`)
        continue // try next upstream
      }

      // Stream response directly
      if (stream) {
        const { readable, writable } = new TransformStream()
        upstreamRes.body?.pipeTo(writable)
        return new NextResponse(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'x-agentbot-provider': upstream.provider,
            'x-agentbot-model': upstreamModel,
          },
        })
      }

      // Non-streaming — return JSON
      const data = await upstreamRes.json()

      // Record usage
      const latencyMs = Date.now() - startTime
      recordGatewayUsage({
        model: upstreamModel,
        provider: upstream.provider,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        latencyMs,
        userId: undefined, // x402 payments are anonymous
      }).catch(() => {})

      return NextResponse.json(data, {
        headers: {
          'x-agentbot-provider': upstream.provider,
          'x-agentbot-model': upstreamModel,
          'x-agentbot-latency-ms': String(latencyMs),
        },
      })
    } catch (err) {
      console.error(`[x402] upstream ${upstream.provider} error:`, err)
      continue
    }
  }

  return NextResponse.json(
    { error: 'All upstream providers failed' },
    { status: 502 }
  )
}
