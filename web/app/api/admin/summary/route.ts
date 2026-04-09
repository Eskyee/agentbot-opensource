import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { isAdminEmail } from '@/app/lib/admin'
import { checkServices } from '@/app/lib/service-health'
import { getTrialCountdown } from '@/app/lib/trial-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const [serviceHealth, activeTrials, expiringSoonUsers, agentStatusGroups, recentErrors] = await Promise.all([
    checkServices(),
    prisma.user.count({
      where: {
        plan: 'free',
        trialEndsAt: { gt: new Date() },
      },
    }),
    prisma.user.findMany({
      where: {
        plan: 'free',
        trialEndsAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true, email: true, trialEndsAt: true },
      orderBy: { trialEndsAt: 'asc' },
      take: 12,
    }),
    prisma.agent.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.agent.findMany({
      where: { status: 'error' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, userId: true, updatedAt: true, status: true },
      take: 5,
    }),
  ])

  const expiringSoon = expiringSoonUsers.map((user) => {
    const countdown = getTrialCountdown(user.trialEndsAt)
    return {
      id: user.id,
      email: user.email,
      endsAt: user.trialEndsAt?.toISOString(),
      daysLeft: countdown?.daysLeft ?? 0,
    }
  })

  const statusMap = agentStatusGroups.reduce<Record<string, number>>((acc, group) => {
    acc[group.status] = group._count._all
    return acc
  }, {})

  return NextResponse.json({
    serviceHealth,
    trial: {
      active: activeTrials,
      expiringSoon,
    },
    agents: {
      totals: statusMap,
      recentErrors,
    },
    timestamp: new Date().toISOString(),
  })
}
