import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Aggregate totals
    const totals = await prisma.$queryRaw<{
      prompt_tokens: bigint
      completion_tokens: bigint
      total_tokens: bigint
      requests: bigint
      errors: bigint
      total_cost: number
      avg_latency: number
    }[]>`
      SELECT
        COALESCE(SUM(input_tokens), 0)::bigint as prompt_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint as completion_tokens,
        COALESCE(SUM(input_tokens + output_tokens), 0)::bigint as total_tokens,
        COUNT(*)::bigint as requests,
        COUNT(*) FILTER (WHERE success = false)::bigint as errors,
        COALESCE(SUM(cost_usd), 0)::float as total_cost,
        COALESCE(AVG(latency_ms), 0)::float as avg_latency
      FROM usage_logs
    `

    // Aggregate by model
    const byModel = await prisma.$queryRaw<{
      model: string
      prompt_tokens: bigint
      completion_tokens: bigint
      total_tokens: bigint
      requests: bigint
      errors: bigint
      total_cost: number
      avg_latency: number
    }[]>`
      SELECT
        model,
        COALESCE(SUM(input_tokens), 0)::bigint as prompt_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint as completion_tokens,
        COALESCE(SUM(input_tokens + output_tokens), 0)::bigint as total_tokens,
        COUNT(*)::bigint as requests,
        COUNT(*) FILTER (WHERE success = false)::bigint as errors,
        COALESCE(SUM(cost_usd), 0)::float as total_cost,
        COALESCE(AVG(latency_ms), 0)::float as avg_latency
      FROM usage_logs
      GROUP BY model
      ORDER BY total_tokens DESC
    `

    // Hourly breakdown (last 7 days)
    const hourly = await prisma.$queryRaw<{
      hour: string
      prompt_tokens: bigint
      completion_tokens: bigint
      total_tokens: bigint
      requests: bigint
      errors: bigint
    }[]>`
      SELECT
        to_char(date_trunc('hour', created_at), 'YYYY-MM-DD"T"HH24') as hour,
        COALESCE(SUM(input_tokens), 0)::bigint as prompt_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint as completion_tokens,
        COALESCE(SUM(input_tokens + output_tokens), 0)::bigint as total_tokens,
        COUNT(*)::bigint as requests,
        COUNT(*) FILTER (WHERE success = false)::bigint as errors
      FROM usage_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY date_trunc('hour', created_at)
      ORDER BY hour ASC
    `

    // Daily breakdown (last 30 days)
    const daily = await prisma.$queryRaw<{
      day: string
      prompt_tokens: bigint
      completion_tokens: bigint
      total_tokens: bigint
      requests: bigint
      errors: bigint
    }[]>`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
        COALESCE(SUM(input_tokens), 0)::bigint as prompt_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint as completion_tokens,
        COALESCE(SUM(input_tokens + output_tokens), 0)::bigint as total_tokens,
        COUNT(*)::bigint as requests,
        COUNT(*) FILTER (WHERE success = false)::bigint as errors
      FROM usage_logs
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY day ASC
    `

    // Get first usage date
    const firstLog = await prisma.usage_logs.findFirst({
      orderBy: { created_at: 'asc' },
      select: { created_at: true },
    })

    // Serialize BigInt to string/number
    const serialize = (val: bigint | number | null) =>
      val === null ? 0 : Number(val)

    const row = totals[0] || {
      prompt_tokens: 0n,
      completion_tokens: 0n,
      total_tokens: 0n,
      requests: 0n,
      errors: 0n,
      total_cost: 0,
      avg_latency: 0,
    }

    return NextResponse.json({
      startedAt: firstLog?.created_at?.toISOString() || new Date().toISOString(),
      totals: {
        prompt_tokens: serialize(row.prompt_tokens),
        completion_tokens: serialize(row.completion_tokens),
        total_tokens: serialize(row.total_tokens),
        requests: serialize(row.requests),
        errors: serialize(row.errors),
        total_cost_usd: Math.round(row.total_cost * 100) / 100,
        avg_latency_ms: Math.round(row.avg_latency),
      },
      byModel: byModel.map((m) => ({
        model: m.model,
        prompt_tokens: serialize(m.prompt_tokens),
        completion_tokens: serialize(m.completion_tokens),
        total_tokens: serialize(m.total_tokens),
        requests: serialize(m.requests),
        errors: serialize(m.errors),
        total_cost_usd: Math.round(m.total_cost * 100) / 100,
        avg_latency_ms: Math.round(m.avg_latency),
        avg_per_request: serialize(m.requests) > 0
          ? Math.round(serialize(m.total_tokens) / serialize(m.requests))
          : 0,
      })),
      hourly: hourly.map((h) => ({
        hour: h.hour,
        prompt_tokens: serialize(h.prompt_tokens),
        completion_tokens: serialize(h.completion_tokens),
        total_tokens: serialize(h.total_tokens),
        requests: serialize(h.requests),
        errors: serialize(h.errors),
      })),
      daily: daily.map((d) => ({
        day: d.day,
        prompt_tokens: serialize(d.prompt_tokens),
        completion_tokens: serialize(d.completion_tokens),
        total_tokens: serialize(d.total_tokens),
        requests: serialize(d.requests),
        errors: serialize(d.errors),
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch usage data', detail: error.message },
      { status: 500 }
    )
  }
}
