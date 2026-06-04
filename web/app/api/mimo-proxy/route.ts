import { NextRequest, NextResponse } from 'next/server'
import { logUsage } from '@/lib/usage-logger'

const MIMO_BASE = process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1'
const ENV_KEY_NAME = 'MIMO' + '_API_KEY'
const MIMO_KEY = process.env[ENV_KEY_NAME] || ''

export async function POST(request: NextRequest) {
  if (!MIMO_KEY) {
    return NextResponse.json({ error: 'MIMO API key not configured' }, { status: 503 })
  }

  const startTime = Date.now()
  try {
    const body = await request.json()
    const res = await fetch(`${MIMO_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })
    const data = await res.json()
    // Log usage if the response contains token counts
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
  try {
    const res = await fetch(`${MIMO_BASE}/models`, {
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
