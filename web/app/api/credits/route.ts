import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await getAuthSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        referralCredits: true,
        plan: true,
        referralCode: true,
        _count: {
          select: {
            referrals: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ credits: 0, referralCode: null, referralCount: 0 })
    }

    return NextResponse.json({
      credits: user.referralCredits,
      referralCode: user.referralCode,
      referralCount: user._count.referrals,
      plan: user.plan,
    })
  } catch (error) {
    console.error('Credits fetch error:', error)
    return NextResponse.json({ credits: 0 }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';