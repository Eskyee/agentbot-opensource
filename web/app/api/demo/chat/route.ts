import { NextRequest, NextResponse } from 'next/server'

const MIMO_BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1'
const MIMO_API_KEY = process.env.MIMO_API_KEY || ''
const DEFAULT_MODEL = 'mimo-v2.5-pro'
const MAX_DEMO_MESSAGES = 10

// In-memory rate limiter (per IP, 10 requests per hour)
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

  // Only allow user/assistant roles
  const sanitized = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20) // Last 20 messages max
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) })) // Truncate long messages

  if (sanitized.length === 0) {
    return NextResponse.json({ error: 'No valid messages' }, { status: 400 })
  }

  try {
    const gwRes = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...sanitized,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!gwRes.ok) {
      const errText = await gwRes.text().catch(() => 'Gateway error')
      console.error('[Demo Chat] Gateway error:', gwRes.status, errText)
      return NextResponse.json(
        { error: 'AI is temporarily unavailable. Try again in a moment.' },
        { status: 502 }
      )
    }

    const data = await gwRes.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({
      reply,
      model: data.model || DEFAULT_MODEL,
      usage: data.usage,
    })
  } catch (err) {
    console.error('[Demo Chat] Error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Try again.' },
      { status: 500 }
    )
  }
}
