import { NextRequest, NextResponse } from 'next/server'
import { logUsage } from '@/lib/usage-logger'

// MiMo API endpoints
// Token Plan: region-locked, coding tools only
// Pay-as-you-go: api.xiaomimimo.com, needs sk- key
const ENV_KEY_NAME = 'MIMO' + '_API_KEY'
const MIMO_KEY = proces…AME] || ''

// Determine which endpoint to use based on key prefix
function getBaseUrl(): string {
  if (MIMO_KEY.startsWith('sk-')) {
    return 'https://api.xiaomimimo.com/v1'  // Pay-as-you-go
  }
  return process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1'  // Token Plan
}

export async function POST(request: NextRequest) {
  if (!MIMO_KEY) {
    return NextResponse.json({ error: 'MIMO API key not configured' }, { status: 503 })
  }

  const startTime = Date.now()
  const baseUrl = getBaseUrl()

  try {
    const body = await request.json()

    // Pass through ALL MiMo API parameters:
    // model, messages, temperature, top_p, max_completion_tokens,
    // frequency_penalty, presence_penalty, stop, stream,
    // response_format, tools, tool_choice, thinking, audio
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_KEY}`,
      },
      body: JSON.stringify({
        model: body.model || 'mimo-v2.5-pro',
        messages: body.messages,
        ...(body.temperature !== undefined && { temperature: body.temperature }),
        ...(body.top_p !== undefined && { top_p: body.top_p }),
        ...(body.max_completion_tokens !== undefined && { max_completion_tokens: body.max_completion_tokens }),
        ...(body.max_tokens !== undefined && { max_tokens: body.max_tokens }),
        ...(body.frequency_penalty !== undefined && { frequency_penalty: body.frequency_penalty }),
        ...(body.presence_penalty !== undefined && { presence_penalty: body.presence_penalty }),
        ...(body.stop !== undefined && { stop: body.stop }),
        ...(body.stream !== undefined && { stream: body.stream }),
        ...(body.response_format !== undefined && { response_format: body.response_format }),
        ...(body.tools !== undefined && { tools: body.tools }),
        ...(body.tool_choice !== undefined && { tool_choice: body.tool_choice }),
        ...(body.thinking !== undefined && { thinking: body.thinking }),
        ...(body.audio !== undefined && { audio: body.audio }),
      }),
      signal: AbortSignal.timeout(120_000),
    })

    // Handle streaming responses
    if (body.stream && res.body) {
      return new Response(res.body, {
        status: res.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    const data = await res.json()

    // Log usage from response
    if (data?.usage) {
      logUsage({
        userId: 'proxy',
        agentId: body.model || 'unknown',
        model: body.model || 'mimo-v2.5-pro',
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
        endpoint: '/api/mimo-proxy',
        latencyMs: Date.now() - startTime,
        success: res.ok,
      })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[mimo-proxy]', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

export async function GET() {
  if (!MIMO_KEY) {
    return NextResponse.json({ error: 'MIMO API key not configured' }, { status: 503 })
  }

  const baseUrl = getBaseUrl()

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${MIMO_KEY}` },
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
