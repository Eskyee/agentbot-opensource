/**
 * GET /api/playground/usage — returns current usage stats for the authenticated user.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getDailyGenerationCount, FREE_DAILY_LIMIT, ADMIN_DAILY_LIMIT } from '@/app/lib/playground-usage'
import { isAdminEmail } from '@/app/lib/admin'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      email: true,
    },
  })

  const isAdmin = isAdminEmail(session.user.email)
  const trialActive = !!(user?.trialEndsAt && user.trialEndsAt > new Date())
  const isPaid = user?.subscriptionStatus === 'active' || trialActive
  const identifier = session.user.id

  const generationsToday = await getDailyGenerationCount(identifier)
  const dailyLimit = isAdmin ? ADMIN_DAILY_LIMIT : isPaid ? Infinity : FREE_DAILY_LIMIT
  const remaining = isPaid || isAdmin
    ? Infinity
    : Math.max(0, FREE_DAILY_LIMIT - generationsToday)

  const projects = await prisma.playgroundProject.count({
    where: { userId: session.user.id },
  })

  const published = await prisma.playgroundProject.count({
    where: { userId: session.user.id, status: 'PUBLISHED' },
  })

  return NextResponse.json({
    plan: user?.plan || 'free',
    subscriptionStatus: user?.subscriptionStatus || 'inactive',
    isAdmin,
    isPaid,
    usage: {
      generationsToday,
      dailyLimit: dailyLimit === Infinity ? 'unlimited' : dailyLimit,
      remaining: remaining === Infinity ? 'unlimited' : remaining,
    },
    projects,
    published,
  })
}
