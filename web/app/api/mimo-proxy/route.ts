import { NextRequest, NextResponse } from 'next/server'

/**
 * MiMo API Proxy — bypasses UK geo-blocking (451) by routing through Vercel's US edge.
 * 
 * The MiMo Token Plan API (token-plan-ams.xiaomimimo.com) blocks UK IPs with:
 * "451 Unavailable For Legal Reasons — cross-border isolation policy"
 * 
 * This proxy runs on Vercel's US servers, which are in an allowed region.
 * OpenClaw and Ask Atlas use this endpoint instead of calling MiMo directly.
 */

const MIMO_BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1'
const MIMO_API_KEY = proces…_KEY || ''

export async function POST(request: NextRequest) {
  if (!MIMO_API_KEY) {
    return NextResponse.json({ error: 'MIMO_API_KEY not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    
    const mimoRes = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })

    const data = await mimoRes.json()
    return NextResponse.json(data, { status: mimoRes.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[MiMo Proxy] Error:', message)
    return NextResponse.json({ error: `Proxy error: ${message}` }, { status: 502 })
  }
}

export async function GET() {
  if (!MIMO_API_KEY) {
    return NextResponse.json({ error: 'MIMO_API_KEY not configured' }, { status: 503 })
  }

  try {
    const mimoRes = await fetch(`${MIMO_BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${MIMO_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    })

    const data = await mimoRes.json()
    return NextResponse.json(data, { status: mimoRes.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
