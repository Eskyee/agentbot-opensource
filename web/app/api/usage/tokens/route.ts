import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const groupByModel = async (where: any) => {
      const results = await prisma.tokenUsage.groupBy({
        by: ['model', 'provider'],
        where,
        _sum: { inputTokens: true, outputTokens: true, totalTokens: true, cost: true },
        _count: { id: true },
        orderBy: { _sum: { cost: 'desc' } },
      })
      return results.map(r => ({
        model: r.model,
        provider: r.provider,
        input: r._sum.inputTokens || 0,
        output: r._sum.outputTokens || 0,
        totalTokens: r._sum.totalTokens || 0,
        cost: r._sum.cost || 0,
        calls: r._count.id,
      }))
    }

    const dailyChart = await prisma.tokenUsage.groupBy({
      by: ['createdAt'],
      where: { userId, createdAt: { gte: weekAgo } },
      _sum: { totalTokens: true, cost: true },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    const [today, week, month, all] = await Promise.all([
      groupByModel({ userId, createdAt: { gte: todayStart } }),
      groupByModel({ userId, createdAt: { gte: weekAgo } }),
      groupByModel({ userId, createdAt: { gte: monthAgo } }),
      groupByModel({ userId }),
    ])

    return NextResponse.json({
      today, week, month, all,
      dailyChart: dailyChart.map(d => ({
        date: d.createdAt.toISOString().split('T')[0],
        tokens: d._sum.totalTokens || 0,
        cost: d._sum.cost || 0,
        calls: d._count.id,
      })),
    })
  } catch (error) {
    console.error('[TokenUsage API] Error:', error)
    return NextResponse.json({ today: [], week: [], month: [], all: [], dailyChart: [] })
  }
}
