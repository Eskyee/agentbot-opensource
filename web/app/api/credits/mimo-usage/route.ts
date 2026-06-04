import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

// MiMo Token Plan credit multipliers per token
// Source: https://mimo.xiaomi.com (2026-06-04)
const MIMO_CREDITS: Record<string, { inputMiss: number; inputHit: number; output: number }> = {
  'mimo-v2.5-pro':         { inputMiss: 300, inputHit: 2.5,  output: 600 },
  'xiaomi/mimo-v2.5-pro':  { inputMiss: 300, inputHit: 2.5,  output: 600 },
  'mimo-v2.5':             { inputMiss: 100, inputHit: 2,    output: 200 },
  'xiaomi/mimo-v2.5':      { inputMiss: 100, inputHit: 2,    output: 200 },
}

// Plan limits in credits
const PLAN_LIMITS: Record<string, number> = {
  free:       0,
  solo:       11_000_000_000,    // Standard: 11B
  collective: 38_000_000_000,    // Pro: 38B
  label:      82_000_000_000,    // Max: 82B
  network:    82_000_000_000,    // Max: 82B (dedicated infra separate)
}

function estimateCredits(model: string, inputTokens: number, outputTokens: number): number {
  const rates = MIMO_CREDITS[model]
  if (!rates) return 0
  // Conservative: assume 50% cache hit rate (realistic with HiCache)
  const inputCredits = (inputTokens * 0.5 * rates.inputHit) + (inputTokens * 0.5 * rates.inputMiss)
  const outputCredits = outputTokens * rates.output
  return Math.round(inputCredits + outputCredits)
}

export async function GET() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const plan = user.plan || 'free'
    const planLimit = PLAN_LIMITS[plan] || 0

    // Sum all MiMo usage for this user
    const usage = await prisma.usage_logs.findMany({
      where: {
        OR: [
          { user_id: session.user.id },
          { user_id: 'demo' },   // Demo usage counts toward platform
          { user_id: 'proxy' },  // Proxy usage counts toward platform
        ],
        model: { contains: 'mimo' },
      },
      select: {
        model: true,
        input_tokens: true,
        output_tokens: true,
        created_at: true,
      },
    })

    let totalCreditsUsed = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for (const log of usage) {
      const input = log.input_tokens || 0
      const output = log.output_tokens || 0
      totalInputTokens += input
      totalOutputTokens += output
      totalCreditsUsed += estimateCredits(log.model || '', input, output)
    }

    // Monthly usage (current billing period)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyUsage = await prisma.usage_logs.findMany({
      where: {
        OR: [
          { user_id: session.user.id },
          { user_id: 'demo' },
          { user_id: 'proxy' },
        ],
        model: { contains: 'mimo' },
        created_at: { gte: monthStart },
      },
      select: {
        model: true,
        input_tokens: true,
        output_tokens: true,
      },
    })

    let monthlyCredits = 0
    let monthlyInput = 0
    let monthlyOutput = 0

    for (const log of monthlyUsage) {
      const input = log.input_tokens || 0
      const output = log.output_tokens || 0
      monthlyInput += input
      monthlyOutput += output
      monthlyCredits += estimateCredits(log.model || '', input, output)
    }

    return NextResponse.json({
      plan,
      planLimit,
      planName: plan === 'label' ? 'Max' : plan === 'collective' ? 'Pro' : plan === 'solo' ? 'Standard' : 'Free',
      totalCreditsUsed,
      totalInputTokens,
      totalOutputTokens,
      monthlyCredits,
      monthlyInput,
      monthlyOutput,
      percentUsed: planLimit > 0 ? Math.round((monthlyCredits / planLimit) * 1000) / 10 : 0,
      // Static info from MiMo
      cacheHitCreditsPerToken: 2.5,
      cacheMissCreditsPerToken: 300,
      outputCreditsPerToken: 600,
    })
  } catch (error) {
    console.error('MiMo usage fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
