import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'


const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'https://YOUR_SERVICE_URL'
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ''
const COST_PER_CALL = 1
const DEFAULT_MODEL = 'openrouter/xiaomi/mimo-v2-pro'

const ALLOWED_MODELS = [
  'openrouter/xiaomi/mimo-v2-pro',
  'openrouter/google/gemini-2.0-flash-001',
  'openrouter/openai/gpt-4o-mini',
]

async function refundCredit(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { referralCredits: { increment: COST_PER_CALL } },
  })
}

async function getRemainingCredits(userId: string) {
  const remaining = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCredits: true },
  })

  return remaining?.referralCredits ?? 0
}

/**
 * POST /api/v1/credits
 * Free credits gateway — each call costs 1 credit from referralCredits
 */
export async function POST(req: NextRequest) {
  let debitedUserId: string | null = null

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

    const parsedBody = await req.json().catch(() => ({}))
    const body = (parsedBody && typeof parsedBody === 'object'
      ? { ...(parsedBody as Record<string, unknown>) }
      : {}) as Record<string, unknown>
    const requestedModel = typeof body.model === 'string' ? body.model : ''
    body.model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : DEFAULT_MODEL

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
    debitedUserId = user.id

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
      await refundCredit(user.id)
      debitedUserId = null
      return NextResponse.json(
        { error: 'gateway_error', message: 'AI gateway unavailable. Credit refunded.' },
        { status: 502 }
      )
    }

    if (!gwRes.ok) {
      const contentType = gwRes.headers.get('content-type') || 'application/json'
      const upstreamBody = await gwRes.text()
      await refundCredit(user.id)
      debitedUserId = null
      const creditsLeft = await getRemainingCredits(user.id)

      return new NextResponse(upstreamBody, {
        status: gwRes.status,
        headers: {
          'Content-Type': contentType,
          'X-Credits-Remaining': String(creditsLeft),
          'X-Credits-Refunded': '1',
        },
      })
    }

    const creditsLeft = await getRemainingCredits(user.id)

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
    if (debitedUserId) {
      await refundCredit(debitedUserId).catch((refundError) => {
        console.error('[Credits Gateway] Refund failed after unexpected error:', refundError)
      })
    }
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
