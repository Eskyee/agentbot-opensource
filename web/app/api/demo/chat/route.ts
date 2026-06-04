import { NextRequest, NextResponse } from 'next/server'

// Demo uses MiMo/OpenRouter directly — NO bridge (bridge is only for /chat when logged in)
const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const MAX_DEMO_MESSAGES = 10

const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= MAX_DEMO_MESSAGES) return false
  entry.count++
  return true
}

const SYSTEM_PROMPT = `You are Agentbot — an AI assistant made by Agentbot.sh, a platform for deploying autonomous AI agents on Base.

Key facts about Agentbot:
- Deploy autonomous agents that run 24/7 on Telegram, Discord, WhatsApp, X
- Powered by MiMo V2.5 Pro (99% cheaper than GPT-5)
- Agents can search the web, manage files, run code, send emails, schedule tasks
- x402 micropayments for pay-per-use AI
- Built for music & culture (powers baseFM — 24/7 autonomous underground radio)
- $AGENTBOT token on Base: 0x986b41c76ab8b7350079613340ee692773b34ba3
- Pricing: Free (BYOK), Solo £29/mo, Collective £69/mo, Label £149/mo, Network £499/mo

Be helpful, concise, and show what an Agentbot agent can do. Keep responses under 200 words.
If someone asks how to get started, point them to agentbot.sh/signup or agentbot.sh/pricing.`

async function callMiMo(messages: { role: string; content: string }[]): Promise<string> {
  // Route through our MiMo proxy (Vercel US edge) to bypass UK geo-blocking
  // MiMo HiCache optimizes cache hits — system prompt is always first and stable,
  // so the KV prefix is cached across requests (cache hit = 120x cheaper)
  const res = await fetch('/api/mimo-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mimo-v2.5-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
      // MiMo HiCache: prefix tokens are cached across requests.
      // Keep system prompt stable = guaranteed cache hit.
      // Keep max_tokens reasonable = output doesn't bloat cache key.
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`MiMo proxy ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'MiMo error')
  return data.choices?.[0]?.message?.content || 'Sorry, no response.'
}

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://agentbot.sh',
      'X-Title': 'Agentbot Demo',
    },
    body: JSON.stringify({
      model: 'xiaomi/mimo-v2.5-pro',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 500,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'Sorry, no response.'
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in an hour, or sign up at agentbot.sh/signup for unlimited access.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const messages = body.messages as { role: string; content: string }[] | undefined

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
  }

  const sanitized = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))

  if (sanitized.length === 0) {
    return NextResponse.json({ error: 'No valid messages' }, { status: 400 })
  }

  // Try OpenRouter first (reliable), then MiMo proxy (intermittent geo-block)
  try {
    if (OPENROUTER_KEY) {
      try {
        const reply = await callOpenRouter(sanitized)
        return NextResponse.json({ reply, source: 'openrouter' })
      } catch (e) {
        console.warn('[Demo] OpenRouter failed, trying MiMo proxy:', e)
      }
    }

    try {
      const reply = await callMiMo(sanitized)
      return NextResponse.json({ reply, source: 'mimo' })
    } catch (e) {
      console.warn('[Demo] MiMo proxy also failed:', e)
    }

    return NextResponse.json(
      { error: 'AI is temporarily unavailable. Try again shortly.' },
      { status: 503 }
    )
  } catch (err) {
    console.error('[Demo] All providers failed:', err)
    return NextResponse.json(
      { error: 'AI is temporarily unavailable. Try again in a moment.' },
      { status: 502 }
    )
  }
}
