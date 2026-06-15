import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        plan: true,
        referralCredits: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
    })

    // Fetch wallet balance separately from the wallets table
    const wallet = await prisma.wallets.findFirst({
      where: { address: { not: '' } },
      select: { balance_usdc: true },
      orderBy: { created_at: 'desc' },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Credit claims
    const claims = await prisma.credit_claims.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    // Usage logs (last 30 days)
    const usage = await prisma.usage_logs.aggregate({
      where: {
        user_id: user.id,
        created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { input_tokens: true, output_tokens: true, cost_usd: true },
      _count: true,
    })

    // Daily usage (last 14 days)
    const dailyUsage = await prisma.$queryRaw<{
      day: string
      tokens: bigint
      cost: number
      requests: bigint
    }[]>`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
        COALESCE(SUM(input_tokens + output_tokens), 0)::bigint as tokens,
        COALESCE(SUM(cost_usd), 0)::float as cost,
        COUNT(*)::bigint as requests
      FROM usage_logs
      WHERE user_id = ${user.id}
        AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY day ASC
    `

    // Agents
    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, status: true, model: true },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        plan: user.plan,
        referralCredits: user.referralCredits,
        referralCode: user.referralCode,
        referralCount: user._count.referrals,
        balance_usdc: wallet?.balance_usdc ? Number(wallet.balance_usdc) : 0,
      },
      credits: {
        balance: user.referralCredits,
        totalClaimed: claims.reduce((sum, c) => sum + c.credits, 0),
        claimCount: claims.length,
      },
      usage: {
        last30d: {
          tokens: usage._sum.input_tokens != null && usage._sum.output_tokens != null
            ? Number(usage._sum.input_tokens) + Number(usage._sum.output_tokens)
            : 0,
          cost_usd: usage._sum.cost_usd ? Number(usage._sum.cost_usd) : 0,
          requests: usage._count,
        },
        daily: dailyUsage.map((d) => ({
          day: d.day,
          tokens: Number(d.tokens),
          cost: Math.round(d.cost * 100) / 100,
          requests: Number(d.requests),
        })),
      },
      claims: claims.map((c) => ({
        id: c.id,
        tier: c.tier,
        credits: c.credits,
        source: c.claim_source,
        token: c.token_address,
        date: c.created_at,
      })),
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        model: a.model,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch credits', detail: error.message },
      { status: 500 }
    )
  }
}
