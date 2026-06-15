import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, agents: { select: { id: true, name: true, status: true } } },
    })

    // Get usage metrics from audit logs
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [auditCount, taskCount] = await Promise.all([
      prisma.auditLog.count({
        where: { userId: session.user.id, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.scheduledTask.count({
        where: { userId: session.user.id },
      }),
    ])

    const planCost: Record<string, number> = {
      solo: 29, collective: 69, label: 149, network: 499,
    }

    return NextResponse.json({
      totalResolutions: auditCount,
      totalTasks: taskCount,
      totalTokens: 0, // Populated from backend when available
      totalRevenue: planCost[user?.plan ?? 'solo'] ?? 0,
      avgRevenuePerUnit: 0,
      conversionRate: 0.85, // Placeholder
    })
  } catch (error) {
    console.error('[Pricing Model API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
