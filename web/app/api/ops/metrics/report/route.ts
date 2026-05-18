import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

/**
 * GET /api/ops/metrics/report
 *
 * Returns aggregated metrics for the ops dashboard.
 * Requires auth session.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const hoursParam = url.searchParams.get('hours')
    const hours = hoursParam ? Math.min(Math.max(parseInt(hoursParam, 10), 1), 168) : 24
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Latest metrics per container
    const latestMetrics = await prisma.container_metrics.findMany({
      where: { user_id: session.user.id },
      orderBy: { sampled_at: 'desc' },
      distinct: ['container_name'],
      select: {
        container_name: true,
        cpu_percent: true,
        mem_percent: true,
        message_count: true,
        error_count: true,
        sampled_at: true,
      },
    })

    // Aggregated stats over the time window
    const [avgMetrics, totalMessages, totalSampleCount, earliestSamples] = await Promise.all([
      prisma.$queryRaw<{ avg_cpu: number | null; avg_mem: number | null }[]>`
        SELECT AVG(cpu_percent)::float as avg_cpu, AVG(mem_percent)::float as avg_mem
        FROM container_metrics
        WHERE user_id = ${session.user.id} AND sampled_at >= ${since}
      `,
      prisma.container_metrics.aggregate({
        where: { user_id: session.user.id, sampled_at: { gte: since } },
        _sum: { message_count: true, error_count: true },
      }),
      prisma.container_metrics.count({
        where: { user_id: session.user.id, sampled_at: { gte: since } },
      }),
      prisma.container_metrics.findMany({
        where: { user_id: session.user.id, sampled_at: { gte: since } },
        select: { sampled_at: true },
        orderBy: { sampled_at: 'asc' },
        take: 1,
      }),
    ])

    const containers = latestMetrics.map((m) => ({
      name: m.container_name,
      cpu: Number(m.cpu_percent ?? 0),
      mem: Number(m.mem_percent ?? 0),
      messages: m.message_count ?? 0,
      errors: m.error_count ?? 0,
      lastSampled: m.sampled_at,
    }))

    return NextResponse.json({
      windowHours: hours,
      containers,
      aggregated: {
        avgCpu: avgMetrics[0]?.avg_cpu ? Math.round(avgMetrics[0].avg_cpu * 100) / 100 : 0,
        avgMem: avgMetrics[0]?.avg_mem ? Math.round(avgMetrics[0].avg_mem * 100) / 100 : 0,
        totalMessages: totalMessages._sum.message_count ?? 0,
        totalErrors: totalMessages._sum.error_count ?? 0,
        sampleCount: totalSampleCount,
        earliestSample: earliestSamples.length > 0 ? since.toISOString() : null,
      },
    })
  } catch (error) {
    console.error('Metrics report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
