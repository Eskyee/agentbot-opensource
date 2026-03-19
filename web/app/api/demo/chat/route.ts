import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, getClientIP } from '@/app/lib/security-middleware'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const DEMO_MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'moonshot/kimi-k2.5-thinking', name: 'Kimi K2.5 Thinking', provider: 'Moonshot' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta' },
  { id: 'minimax/minimax-chat', name: 'MiniMax M2.7', provider: 'MiniMax' },
]

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { message, model, mode, conversation } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Always use server-side key — never accept caller-supplied keys
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'Demo unavailable — service not configured.' }, { status: 503 })
    }

    const modelId = model || 'anthropic/claude-sonnet-4.5'

    // Only allow user-role messages from client conversation history (prevent role injection)
    const safeHistory = (Array.isArray(conversation) ? conversation : [])
      .filter((m: any) => m && m.role === 'user' && typeof m.content === 'string')
      .map((m: any) => ({ role: 'user' as const, content: String(m.content).slice(0, 4000) }))

const AGENTBOT_SYSTEM_PROMPT = `You are Agentbot, an AI agent platform for music operations deployed on Base.

## What is Agentbot?
Agentbot deploys OpenClaw (300K+ GitHub stars) to the cloud. Users sign up, choose a plan, and get a 24/7 AI agent that works across Telegram, Discord, WhatsApp.

## Pricing (4 Plans)
- SOLO: £29/mo — 1 concurrent thread, Telegram, 100 BlockDB queries/mo
- COLLECTIVE: £69/mo — 3 concurrent threads, Telegram+WhatsApp, 5K BlockDB, x402 payments
- LABEL: £149/mo — 10 concurrent threads, all channels, white-label, staging
- NETWORK: £499/mo + 15% revenue — unlimited, dedicated VM, reseller tools

## Core Services
- BlockDB: Query 100M+ music components, £0.001/query, onchain attribution
- Skills: Visual Synthesizer (artwork), Track Archaeologist (catalog), Setlist Oracle (DJ sets), Groupie Manager (fan CRM), Royalty Tracker, Demo Submitter
- Event Skills: Ticketing (x402 USDC), Scheduler (Telegram/Discord/Email), Venue Finder (global + UK), Festival Finder (UK/Europe/USA)
- x402: Accept USDC payments on Base, micropayments for royalties
- Base FM: Submit demos, host radio shows, automatic royalty distribution

## Technical
- BYOK: Connect your own OpenRouter/Anthropic/OpenAI keys (no markup)
- Managed: We manage keys at cost + 20%
- Actor-model: Thread = conversation (~50MB RAM), Agent = persona config (stored), Crew = 3-10 coordinating
- Default model: Kimi K2.5 (balanced quality/cost for music)

## Skills Available
When users ask about or want to use these skills, you can help them:
- Visual Synthesizer: Generate artwork - POST to /api/skills/visual-synthesizer with {prompt, style}
- Track Archaeologist: Search catalog - POST to /api/skills/track-archaeologist with {action: "search", bpm, genre, mood}
- Setlist Oracle: Build DJ sets - POST to /api/skills/setlist-oracle with {action: "build", genre, duration}
- Groupie Manager: Fan CRM - POST to /api/skills/groupie-manager with {action: "segment"}
- Royalty Tracker: Check royalties - POST to /api/skills/royalty-tracker with {action: "total"}
- Demo Submitter: Submit to Base FM - POST to /api/skills/demo-submitter with {action: "submit", title, artist}
- Event Ticketing: Sell tickets with USDC - POST to /api/skills/event-ticketing with {action: "purchase", eventId, email, tier}
- Event Scheduler: Schedule events - POST to /api/skills/event-scheduler with {action: "schedule", title, date, time, channels}
- Venue Finder: Find venues globally - POST to /api/skills/venue-finder with {action: "search", city, type, capacity, maxPrice}
- Festival Finder: Discover festivals - POST to /api/skills/festival-finder with {action: "search", genre, country, budget}

## Tone
Direct, subculture-literate, anti-hype. Use "threads" not "agents" for runtime. Use "configurations" for stored personas. Never say "unlimited" when "concurrent" is the actual limit.

Be helpful, concise, and demonstrate agent capabilities.`

    const messages = [
      {
        role: 'system',
        content: AGENTBOT_SYSTEM_PROMPT
      },
      ...safeHistory,
      { role: 'user', content: message }
    ]

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agentbot.raveculture.xyz',
        'X-Title': 'Agentbot Demo'
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: false,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      const rawError = await response.text()
      console.error('OpenRouter error:', response.status, rawError)
      return NextResponse.json({
        error: 'AI service error. Please try again.'
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({
      id: data.id,
      model: modelId,
      message: data.choices?.[0]?.message?.content || 'No response',
      usage: data.usage,
      done: true
    })
  } catch (error) {
    console.error('Demo chat error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    models: DEMO_MODELS,
    mode: 'demo',
    message: 'Welcome to Agentbot Demo - try AI models without deploying'
  })
}
