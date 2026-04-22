import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'
import { getEmptyCommunityRewardStatus, getUserCommunityRewardStatus } from '@/app/lib/solanaRewards'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  await maybeAutoSyncManagedRuntimeForUser(userId).catch(() => {})

  const [user, openclawUser, registration, communityRewards] = await Promise.all([
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
    getUserCommunityRewardStatus(userId).catch(() =>
      getEmptyCommunityRewardStatus({
        availability: 'degraded',
        detail: 'Community reward status is temporarily unavailable.',
      })
    ),
  ])

  // Use user's specific token, fallback to shared token only if needed
  const userToken = registration[0]?.gateway_token

  let effectiveOpenclawUrl = openclawUser?.openclawUrl ?? null
  let effectiveOpenclawInstanceId = openclawUser?.openclawInstanceId ?? null

  if (!effectiveOpenclawInstanceId) {
    const latestAgent = await prisma.agent.findFirst({
      where: { userId },
      select: {
        id: true,
        websocketUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null)

    const looksLikeManagedRuntime = latestAgent?.id && (
      /^[a-f0-9]{16}$/i.test(latestAgent.id) ||
      String(latestAgent.websocketUrl || '').includes('agentbot-agent-')
    )

    if (looksLikeManagedRuntime) {
      effectiveOpenclawInstanceId = latestAgent.id
      effectiveOpenclawUrl = latestAgent.websocketUrl || null
    }
  }

  return NextResponse.json({
    credits: user?.referralCredits ?? 0,
    referralCode: user?.referralCode ?? null,
    referralCount: user?._count.referrals ?? 0,
    plan: user?.plan ?? null,
    openclawUrl: effectiveOpenclawUrl,
    openclawInstanceId: effectiveOpenclawInstanceId,
    gatewayToken: userToken || null,
    communityRewards,
  })
}

export const dynamic = 'force-dynamic'
