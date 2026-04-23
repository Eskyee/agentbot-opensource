/**
 * GET /api/dashboard/data
 * 
 * Returns all dashboard data in a SINGLE request
 * This eliminates multiple round-trips and dramatically improves load time
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'
import { probeOpenClawRuntime } from '@/app/lib/openclaw-runtime-probe'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { getUserCommunityRewardStatus, getEmptyCommunityRewardStatus } from '@/app/lib/solanaRewards'
import { isOperatorModeEnabledForUser } from '@/app/lib/feature-flags'
import { resolveUserMode } from '@/app/lib/operator-routing'
import { getTrialCountdown } from '@/app/lib/trial-utils'


export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getAuthSession()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    // Ensure managed runtime is synced before fetching
    await maybeAutoSyncManagedRuntimeForUser(userId).catch(() => {})

    // PARALLEL QUERY EXECUTION
    const [
      userData,
      agentData,
      registration,
      communityRewards,
      mode
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCredits: true,
          plan: true,
          openclawUrl: true,
          openclawInstanceId: true,
          subscriptionStatus: true,
          referralCode: true,
          trialEndsAt: true,
          _count: { select: { referrals: true } },
        }
      }),
      prisma.agent.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          name: true,
          tier: true,
          createdAt: true,
          websocketUrl: true,
        }
      }),
      prisma.$queryRaw<{ gateway_token: string | null, registered_at: Date | null, last_seen: Date | null, status: string | null }[]>`
        SELECT gateway_token, registered_at, last_seen, status FROM agent_registrations WHERE user_id = ${userId} LIMIT 1
      `,
      getUserCommunityRewardStatus(userId).catch(() =>
        getEmptyCommunityRewardStatus({
          availability: 'degraded',
          detail: 'Community reward status is temporarily unavailable.',
        })
      ),
      resolveUserMode(userId, userEmail).catch((err) => {
        console.warn('[Dashboard Data] resolveUserMode failed:', err)
        return 'advanced' as const
      })
    ])

    const operatorEnabled = isOperatorModeEnabledForUser(userEmail)
    const countdown = getTrialCountdown(userData?.trialEndsAt)

    // Resolve instance data
    const instanceId = userData?.openclawInstanceId || agentData?.id || userId
    const persistedUrl = userData?.openclawUrl || agentData?.websocketUrl || `https://agentbot-agent-${instanceId}-production.up.railway.app`

    // Probe runtime status
    const runtime = await probeOpenClawRuntime(persistedUrl)

    // Safe ISO coercion — $queryRaw may return Dates as strings on serverless drivers
    const toIso = (v: unknown): string | null => {
      if (!v) return null
      if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString()
      if (typeof v === 'string') {
        const t = Date.parse(v)
        return Number.isNaN(t) ? null : new Date(t).toISOString()
      }
      return null
    }

    // Build consolidated response
    const response = {
      userId,
      credits: userData?.referralCredits || 0,
      plan: userData?.plan || 'free',
      referralCode: userData?.referralCode || null,
      referralCount: userData?._count?.referrals || 0,
      openclawUrl: userData?.openclawUrl || persistedUrl,
      openclawInstanceId: instanceId,
      gatewayToken: registration[0]?.gateway_token,
      operatorEnabled,
      mode,
      trial: countdown ? {
        expired: countdown.expired,
        daysLeft: countdown.daysLeft,
        endsAt: countdown.endsAt,
      } : null,
      communityRewards,
      instance: {
        userId: instanceId,
        status: runtime.status,
        statusReason: runtime.reason || null,
        probeChecks: runtime.checks || [],
        url: persistedUrl,
        plan: userData?.plan || 'free',
        openclawVersion: runtime.openclawVersion || DEFAULT_OPENCLAW_VERSION,
        ffmpegAvailable: runtime.ffmpeg?.available || false,
        provisionedAt: toIso(registration[0]?.registered_at) || toIso(agentData?.createdAt),
        lastSeenAt: toIso(registration[0]?.last_seen),
        gatewayProcessStatus: registration[0]?.status || null,
        subscriptionStatus: userData?.subscriptionStatus || null,
      },
      stats: {
        cpu: '0%',
        memory: '0MB',
        uptime: runtime.uptime || (runtime.status === 'healthy' ? 'active' : 'unknown'),
        health: runtime.status === 'healthy' ? 'healthy' : runtime.status,
        telemetry: {
          resourceMetricsAvailable: false,
          lifecycleMetricsAvailable: false,
          messageMetricsAvailable: false,
        }
      },
      health: {
        status: 'healthy',
        checks: [
          { name: 'Database', status: 'ok' as const },
          { name: 'Runtime', status: runtime.status === 'healthy' ? 'ok' as const : 'degraded' as const, detail: runtime.reason }
        ]
      },
      meta: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
      }
    })

  } catch (error) {
    console.error('[Dashboard Data] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}
