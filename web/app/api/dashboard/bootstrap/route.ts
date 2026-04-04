import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { readSharedGatewayToken } from '@/app/lib/gateway-token'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user, openclawUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCredits: true,
        plan: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        openclawUrl: true,
        openclawInstanceId: true,
      },
    }),
  ])

  return NextResponse.json({
    credits: user?.referralCredits ?? 0,
    referralCode: user?.referralCode ?? null,
    referralCount: user?._count.referrals ?? 0,
    plan: user?.plan ?? null,
    openclawUrl: openclawUser?.openclawUrl ?? null,
    openclawInstanceId: openclawUser?.openclawInstanceId ?? null,
    gatewayToken: readSharedGatewayToken() || null,
  })
}

export const dynamic = 'force-dynamic'
