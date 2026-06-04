import { NextRequest, NextResponse } from 'next/server'
import { logUsage } from '@/lib/usage-logger'

const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const MAX_MESSAGES = 20

const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 30) return false
  entry.count++
  return true
}

const SUPPORT_PROMPT = `You are Atlas, the AI support agent for Agentbot (agentbot.sh). You help users with setup, troubleshooting, billing, and platform questions. You are powered by MiMo V2.5 Pro.

PERSONALITY:
- Friendly, concise, helpful — like a knowledgeable friend, not a corporate bot
- Use bullet points for multi-step instructions
- If you don't know something, say so and suggest contacting support@agentbot.sh
- Keep responses under 300 words unless the question requires more

KNOWLEDGE BASE:

## What is Agentbot?
Agentbot is a platform for deploying autonomous AI agents that run 24/7. One click to deploy. No code required. Agents can monitor X/Twitter, manage email, handle tasks, stream music, process payments, and more. Built on OpenClaw (open-source AI runtime). Powered by MiMo V2.5 Pro.

## Pricing
- **Free (BYOK)**: Bring your own MiMo subscription key. We charge nothing for the platform. You pay MiMo directly for tokens.
- **Solo £29/mo**: 1 agent, all channels (Telegram, Discord, WhatsApp, X), 24/7 operation
- **Collective £69/mo**: 3 agents, priority support
- **Label £149/mo**: 10 agents, custom skills, API access
- **Network £499/mo**: Unlimited agents, white-label, dedicated support
- All plans: No per-token charges. Flat rate. MiMo V2.5 Pro included.

## Getting Started
1. Go to agentbot.sh/signup
2. Choose a plan (or Free BYOK)
3. Connect your channels (Telegram, Discord, WhatsApp, X)
4. Your agent deploys in ~2 minutes
5. Agent runs 24/7 — check dashboard at agentbot.sh/dashboard

## BYOK (Bring Your Own Key)
- Get a MiMo subscription at mimo.xiaomi.com
- Choose the Max Monthly Plan (82B credits)
- Paste your API key in Agentbot settings
- Free tier: no platform fee, you pay MiMo directly

## Common Issues
- **Agent not responding**: Check dashboard status. Ensure channels are connected. Try restarting the agent.
- **Telegram bot not working**: Verify bot token in settings. Make sure the bot is added to the group/channel.
- **Rate limits**: Free tier has hourly limits. Upgrade for unlimited.
- **Payment issues**: Check Stripe billing at agentbot.sh/dashboard/billing

## OpenClaw
Agentbot is built on OpenClaw — the open-source personal AI runtime. OpenClaw handles:
- Multi-channel messaging (Telegram, Discord, WhatsApp, Signal, iMessage, X)
- Agent routing and sessions
- Tool execution (web search, file ops, code execution)
- Memory and context management
- Skills system (extensible capabilities)

## Technical Details
- Stack: Next.js, Prisma + PostgreSQL, Stripe, NextAuth, Wagmi/Viem
- Blockchain: Base (L2)
- Token: $AGENTBOT on Base (0x986b41c76ab8b7350079613340ee692773b34ba3)
- Open source: github.com/Eskyee/agentbot-opensource

## Links
- Platform: agentbot.sh
- Dashboard: agentbot.sh/dashboard
- Docs: agentbot.sh/documentation
- Blog: agentbot.sh/blog
- GitHub: github.com/Eskyee/agentbot-opensource
- X: @Esky33junglist

If someone asks about something not covered here, be honest that you don't have that specific info and suggest they check the docs or email support@agentbot.sh.`

async function callMiMo(messages: { role: string; content: string }[]): Promise<string> {
  // Route through our MiMo proxy (Vercel US edge) to bypass UK geo-blocking
  // MiMo HiCache: system prompt is cached as KV prefix across requests.
  // Stable system prompt = guaranteed cache hit = 120x cheaper.
  const res = await fetch('/api/mimo-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mimo-v2.5-pro',
      messages: [
        { role: 'system', content: SUPPORT_PROMPT },
        ...messages,
      ],
      max_tokens: 800,
      temperature: 0.7,
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
      'X-Title': 'Agentbot Support',
    },
    body: JSON.stringify({
      model: 'xiaomi/mimo-v2.5-pro',
      messages: [{ role: 'system', content: SUPPORT_PROMPT }, ...messages],
      max_tokens: 800,
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
      { error: 'Too many questions. Please wait a bit or email support@agentbot.sh for help.' },
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
    .slice(-MAX_MESSAGES)
    .map(m => ({ role: m.role, content: m.content.slice(0, 3000) }))

  if (sanitized.length === 0) {
    return NextResponse.json({ error: 'No valid messages' }, { status: 400 })
  }

  // Try OpenRouter first (reliable), then MiMo proxy (intermittent geo-block)
  const startTime = Date.now()
  try {
    if (OPENROUTER_KEY) {
      try {
        const reply = await callOpenRouter(sanitized)
        logUsage({ userId: 'support', agentId: 'atlas', model: 'xiaomi/mimo-v2.5-pro', inputTokens: sanitized.length * 200, outputTokens: reply.length / 4, endpoint: '/api/support/chat', latencyMs: Date.now() - startTime, success: true })
        return NextResponse.json({ reply, source: 'openrouter' })
      } catch (e) {
        console.warn('[Support] OpenRouter failed, trying MiMo proxy:', e)
      }
    }

    try {
      const reply = await callMiMo(sanitized)
      logUsage({ userId: 'support', agentId: 'atlas', model: 'mimo-v2.5-pro', inputTokens: sanitized.length * 200, outputTokens: reply.length / 4, endpoint: '/api/support/chat', latencyMs: Date.now() - startTime, success: true })
      return NextResponse.json({ reply, source: 'mimo' })
    } catch (e) {
      console.warn('[Support] MiMo proxy also failed:', e)
    }

    return NextResponse.json(
      { error: 'Support AI is temporarily unavailable. Please email support@agentbot.sh' },
      { status: 503 }
    )
  } catch (err) {
    console.error('[Support] All providers failed:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or email support@agentbot.sh' },
      { status: 502 }
    )
  }
}
