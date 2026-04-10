import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'https://openclaw-production-a09d.up.railway.app'
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ''
const COST_PER_CALL = 1
const DEFAULT_MODEL = 'openrouter/xiaomi/mimo-v2-pro'

const ALLOWED_MODELS = [
  'openrouter/xiaomi/mimo-v2-pro',
  'openrouter/google/gemini-2.0-flash-001',
  'openrouter/openai/gpt-4o-mini',
]

/**
 * POST /api/v1/credits
 * Free credits gateway — each call costs 1 credit from referralCredits
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Login required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, referralCredits: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.referralCredits < COST_PER_CALL) {
      return NextResponse.json(
        {
          error: 'insufficient_credits',
          message: `Need ${COST_PER_CALL} credit, have ${user.referralCredits}. Claim at agentbot.sh/claim`,
          credits: user.referralCredits,
        },
        { status: 402 }
      )
    }

    const body = await req.json()
    body.model = ALLOWED_MODELS.includes(body.model) ? body.model : DEFAULT_MODEL

    // Debit before call (prevent double-spend)
    const updated = await prisma.user.updateMany({
      where: { id: user.id, referralCredits: { gte: COST_PER_CALL } },
      data: { referralCredits: { decrement: COST_PER_CALL } },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'insufficient_credits' },
        { status: 402 }
      )
    }

    // Proxy to gateway
    let gwRes: Response
    try {
      gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      })
    } catch {
      // Refund on failure
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCredits: { increment: COST_PER_CALL } },
      })
      return NextResponse.json(
        { error: 'gateway_error', message: 'AI gateway unavailable. Credit refunded.' },
        { status: 502 }
      )
    }

    const remaining = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCredits: true },
    })

    const creditsLeft = remaining?.referralCredits ?? 0

    // Stream or JSON response
    const ct = gwRes.headers.get('content-type') || ''
    if (ct.includes('text/event-stream') || body.stream) {
      return new NextResponse(gwRes.body, {
        status: gwRes.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Credits-Remaining': String(creditsLeft),
        },
      })
    }

    const text = await gwRes.text()
    let data: Record<string, unknown>
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    return NextResponse.json(
      { ...data, _credits: { cost: COST_PER_CALL, remaining: creditsLeft } },
      { status: gwRes.status, headers: { 'X-Credits-Remaining': String(creditsLeft) } }
    )
  } catch (error) {
    console.error('[Credits Gateway] Error:', error)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

/**
 * GET /api/v1/credits — check balance
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { referralCredits: true, plan: true },
  })

  return NextResponse.json({
    credits: user?.referralCredits ?? 0,
    plan: user?.plan ?? 'free',
    costPerCall: COST_PER_CALL,
    allowedModels: ALLOWED_MODELS,
  })
}
