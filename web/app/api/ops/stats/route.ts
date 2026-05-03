import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Throughput: count of execution_logs in last 24h / minutes elapsed
    const executionCount = await prisma.execution_logs.count({
      where: {
        user_id: session.user.id,
        created_at: { gte: twentyFourHoursAgo },
      },
    })

    const minutesElapsed = 24 * 60 // 1440 minutes in 24h
    const callsPerMin = executionCount > 0
      ? Math.round((executionCount / minutesElapsed) * 100) / 100
      : 0

    // p95 latency from usage_logs (last 24h)
    // Prisma doesn't support percentile directly, so use raw query
    const p95Result = await prisma.$queryRaw<{ p95: number }[]>`
      SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95
      FROM usage_logs
      WHERE user_id = ${session.user.id}
        AND created_at >= ${twentyFourHoursAgo}
        AND latency_ms IS NOT NULL
    `
    const p95 = p95Result[0]?.p95 ? Math.round(Number(p95Result[0].p95)) : 0

    // Error rate: failed execution_logs / total execution_logs (last 24h)
    const failedCount = await prisma.execution_logs.count({
      where: {
        user_id: session.user.id,
        created_at: { gte: twentyFourHoursAgo },
        success: false,
      },
    })
    const errorRate = executionCount > 0
      ? Math.round((failedCount / executionCount) * 100 * 100) / 100
      : 0

    // Spend 24h: sum of cost_usd from usage_logs
    const spendResult = await prisma.usage_logs.aggregate({
      where: {
        user_id: session.user.id,
        created_at: { gte: twentyFourHoursAgo },
      },
      _sum: { cost_usd: true },
    })
    const spend24h = spendResult._sum.cost_usd
      ? Number(spendResult._sum.cost_usd)
      : 0

    // Mirror lag: avg interval between container_metrics samples (if available)
    const sampleIntervalResult = await prisma.$queryRaw<{ avg_interval_ms: number }[]>`
      SELECT AVG(diff) as avg_interval_ms FROM (
        SELECT EXTRACT(EPOCH FROM (sampled_at - LAG(sampled_at) OVER (ORDER BY sampled_at))) * 1000 as diff
        FROM container_metrics
        WHERE user_id = ${session.user.id}
          AND sampled_at >= ${twentyFourHoursAgo}
      ) sub
      WHERE diff IS NOT NULL
    `
    const mirrorLag = sampleIntervalResult[0]?.avg_interval_ms
      ? Math.round(Number(sampleIntervalResult[0].avg_interval_ms) / 1000)
      : 0

    return NextResponse.json({
      throughput: { callsPerMin, total24h: executionCount },
      p95Latency: p95,
      errorRate,
      spend24h,
      mirrorLag,
    })
  } catch (error) {
    console.error('Ops stats error:', error)
    return NextResponse.json({
      throughput: { callsPerMin: 0, total24h: 0 },
      p95Latency: 0,
      errorRate: 0,
      spend24h: 0,
      mirrorLag: 0,
    })
  }
}
