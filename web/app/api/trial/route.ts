import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getTrialCountdown } from '@/app/lib/trial-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ trial: false })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, trialEndsAt: true, subscriptionStatus: true },
  })
  if (!user) return NextResponse.json({ trial: false })

  const isPaid = user.subscriptionStatus === 'active' || user.plan !== 'free'
  if (isPaid) return NextResponse.json({ trial: false, plan: user.plan })

  const countdown = getTrialCountdown(user.trialEndsAt)
  if (!countdown) {
    return NextResponse.json({ trial: false, plan: 'free' })
  }

  if (countdown.expired) {
    return NextResponse.json({
      trial: true,
      expired: true,
      daysLeft: 0,
      endsAt: countdown.endsAt,
      plan: 'free',
    })
  }

  return NextResponse.json({
    trial: true,
    expired: false,
    daysLeft: countdown.daysLeft,
    endsAt: countdown.endsAt,
    plan: 'free',
  })
}
