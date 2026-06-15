import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { logUsage } from '@/lib/usage-logger'

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

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  headers: {
    'HTTP-Referer': 'https://agentbot.sh',
    'X-OpenRouter-Title': 'Agentbot',
    'X-OpenRouter-Categories': 'personal-agent,cloud-agent,general-chat',
  },
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many questions. Please wait a bit or email support@agentbot.sh for help.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const body = await request.json().catch(() => ({}))
  const messages = body.messages as { role: string; content?: string; parts?: Array<{ type: string; text?: string }> }[] | undefined

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // Handle both v5 { role, content } and v6 { role, parts } formats
  function extractContent(m: { role: string; content?: string; parts?: Array<{ type: string; text?: string }> }): string {
    if (typeof m.content === 'string') return m.content
    if (Array.isArray(m.parts)) {
      return m.parts
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text!)
        .join('')
    }
    return ''
  }

  const sanitized = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_MESSAGES)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: extractContent(m).slice(0, 3000) }))
    .filter(m => m.content.length > 0)

  if (sanitized.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid messages' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Support AI is temporarily unavailable. Please email support@agentbot.sh' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const startTime = Date.now()

  const result = streamText({
    model: openrouter.chat('xiaomi/mimo-v2.5-pro'),
    system: SUPPORT_PROMPT,
    messages: sanitized,
    maxOutputTokens: 800,
    temperature: 0.7,
    onFinish: async ({ text, usage }) => {
      logUsage({
        userId: 'support',
        agentId: 'atlas',
        model: 'xiaomi/mimo-v2.5-pro',
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        endpoint: '/api/support/chat',
        latencyMs: Date.now() - startTime,
        success: true,
      })
    },
  })

  return result.toTextStreamResponse()
}
