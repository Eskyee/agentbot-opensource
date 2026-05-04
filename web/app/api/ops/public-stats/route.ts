import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/app/lib/prisma'

// Public endpoint — no auth required. Marketing page only.
//
// Stats are cached for 60s via unstable_cache and the response is sent with
// `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` so the CDN
// can serve them without a function invocation. With ~5 Prisma counts +
// 2 raw queries per uncached call, this is the highest-impact cache target
// in the API surface.
//
// We deliberately do NOT use `export const revalidate` here — it would tell
// Next.js to prerender the route at build time, which fails because Prisma
// has no DATABASE_URL during the build. The unstable_cache + Cache-Control
// header give us the same effect for runtime requests.
export const dynamic = 'force-dynamic'

const PUBLIC_STATS_TAG = 'ops-public-stats'

const fetchPublicStats = unstable_cache(
  async () => {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Agent count
    const totalAgents = await prisma.agent.count().catch(() => 0)

    // Throughput: execution_logs in last 24h
    const executionCount = await prisma.execution_logs
      .count({
        where: { created_at: { gte: twentyFourHoursAgo } },
      })
      .catch(() => 0)

    const callsPerMin = executionCount > 0 ? Math.round((executionCount / 1440) * 100) / 100 : 0

    // p95 latency from usage_logs
    const p95Result = await prisma.$queryRaw<{ p95: number }[]>`
      SELECT COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::int as p95
      FROM usage_logs
      WHERE created_at >= ${twentyFourHoursAgo}
    `.catch(() => [{ p95: 0 }])
    const p95 = Number(p95Result[0]?.p95 || 0)

    // Mirror lag: avg interval between container_metrics samples
    const lagResult = await prisma.$queryRaw<{ lag: number }[]>`
      SELECT COALESCE(AVG(interval_ms), 0)::int as lag FROM (
        SELECT EXTRACT(EPOCH FROM (sampled_at - LAG(sampled_at) OVER (PARTITION BY container_name ORDER BY sampled_at))) * 1000 as interval_ms
        FROM container_metrics
        WHERE sampled_at >= ${twentyFourHoursAgo}
      ) sub WHERE interval_ms > 0 AND interval_ms < 60000
    `.catch(() => [{ lag: 0 }])
    const mirrorLag = Number(lagResult[0]?.lag || 0)

    // Verified facts: count of successful executions / total
    const totalExecs = await prisma.execution_logs.count().catch(() => 0)
    const successExecs = await prisma.execution_logs
      .count({ where: { success: true } })
      .catch(() => 0)
    const verifiedFacts = totalExecs > 0 ? Math.round((successExecs / totalExecs) * 1000) / 10 : 0

    return {
      fleetSize: totalAgents,
      callsPerMin,
      p95,
      mirrorLag,
      verifiedFacts,
    }
  },
  ['ops:public-stats'],
  { revalidate: 60, tags: [PUBLIC_STATS_TAG] },
)

export async function GET() {
  try {
    const stats = await fetchPublicStats()
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch {
    return NextResponse.json({
      fleetSize: 0,
      callsPerMin: 0,
      p95: 0,
      mirrorLag: 0,
      verifiedFacts: 0,
    })
  }
}
