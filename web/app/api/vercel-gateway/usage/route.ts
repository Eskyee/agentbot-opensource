import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const runtime = 'nodejs'

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  return Number(value || 0)
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [personal, global, byModel, recentKeys] = await Promise.all([
    prisma.usage_logs.aggregate({
      where: { user_id: session.user.id, endpoint: '/v1/chat/completions', created_at: { gte: since } },
      _sum: { input_tokens: true, output_tokens: true, cost_usd: true },
      _count: { id: true },
    }),
    prisma.usage_logs.aggregate({
      where: { endpoint: '/v1/chat/completions', created_at: { gte: since } },
      _sum: { input_tokens: true, output_tokens: true, cost_usd: true },
      _count: { id: true },
    }),
    prisma.usage_logs.groupBy({
      by: ['model'],
      where: { endpoint: '/v1/chat/completions', created_at: { gte: since } },
      _sum: { input_tokens: true, output_tokens: true, cost_usd: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
    prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({
    windowDays: 30,
    personal: {
      requests: personal._count.id,
      inputTokens: personal._sum.input_tokens || 0,
      outputTokens: personal._sum.output_tokens || 0,
      costUsd: toNumber(personal._sum.cost_usd),
    },
    global: {
      requests: global._count.id,
      inputTokens: global._sum.input_tokens || 0,
      outputTokens: global._sum.output_tokens || 0,
      costUsd: toNumber(global._sum.cost_usd),
    },
    byModel: byModel.map((row) => ({
      model: row.model,
      requests: row._count.id,
      inputTokens: row._sum.input_tokens || 0,
      outputTokens: row._sum.output_tokens || 0,
      costUsd: toNumber(row._sum.cost_usd),
    })),
    keys: recentKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPreview: `${key.keyPrefix}...`,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
    })),
  })
}

