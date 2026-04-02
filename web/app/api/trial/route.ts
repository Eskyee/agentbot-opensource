import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

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

  if (!user.trialEndsAt) return NextResponse.json({ trial: false, plan: 'free' })

  const now = new Date()
  const endsAt = new Date(user.trialEndsAt)
  const msLeft = endsAt.getTime() - now.getTime()
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
  const expired = msLeft <= 0

  return NextResponse.json({
    trial: true,
    expired,
    daysLeft: Math.max(0, daysLeft),
    endsAt: endsAt.toISOString(),
  })
}
