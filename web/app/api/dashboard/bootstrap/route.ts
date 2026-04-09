import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  await maybeAutoSyncManagedRuntimeForUser(userId).catch(() => {})

  const [user, openclawUser, registration] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCredits: true,
        plan: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        openclawUrl: true,
        openclawInstanceId: true,
      },
    }),
    // Get user's specific gateway token from agent_registrations
    prisma.$queryRaw<{ gateway_token: string | null }[]>`
      SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId} LIMIT 1
    `,
  ])

  // Use user's specific token, fallback to shared token only if needed
  const userToken = registration[0]?.gateway_token

  return NextResponse.json({
    credits: user?.referralCredits ?? 0,
    referralCode: user?.referralCode ?? null,
    referralCount: user?._count.referrals ?? 0,
    plan: user?.plan ?? null,
    openclawUrl: openclawUser?.openclawUrl ?? null,
    openclawInstanceId: openclawUser?.openclawInstanceId ?? null,
    gatewayToken: userToken || null,
  })
}

export const dynamic = 'force-dynamic'
