import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { logUsage } from '@/lib/usage-logger'

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
      JSON.stringify({ error: 'Rate limit exceeded. Try again in an hour, or sign up at agentbot.sh/signup for unlimited access.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const body = await request.json().catch(() => ({}))
  const messages = body.messages as { role: string; content: string }[] | undefined

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const sanitized = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 2000) }))

  if (sanitized.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid messages' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI is temporarily unavailable.' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
  }

  const startTime = Date.now()

  const result = streamText({
    model: openrouter.chat('xiaomi/mimo-v2.5-pro'),
    system: SYSTEM_PROMPT,
    messages: sanitized,
    maxOutputTokens: 500,
    temperature: 0.7,
    onFinish: async ({ text, usage }) => {
      logUsage({
        userId: 'demo',
        agentId: 'demo',
        model: 'xiaomi/mimo-v2.5-pro',
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        endpoint: '/api/demo/chat',
        latencyMs: Date.now() - startTime,
        success: true,
      })
    },
  })

  return result.toTextStreamResponse()
}
