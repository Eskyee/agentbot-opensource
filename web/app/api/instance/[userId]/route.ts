import { NextRequest, NextResponse } from 'next/server'
import { verifyInstanceOwnership } from '../_auth'
import { prisma } from '@/app/lib/prisma'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'

async function probeRuntime(url: string) {
  const normalized = String(url).replace(/\/$/, '')

  try {
    const [healthRes, readyRes, statusRes] = await Promise.allSettled([
      fetch(`${normalized}/healthz`, {
        signal: AbortSignal.timeout(5000),
        cache: 'no-store',
      }),
      fetch(`${normalized}/readyz`, {
        signal: AbortSignal.timeout(4000),
        cache: 'no-store',
      }),
      fetch(`${normalized}/api/status`, {
        signal: AbortSignal.timeout(5000),
        cache: 'no-store',
      }),
    ])

    const healthOk = healthRes.status === 'fulfilled' && healthRes.value.ok
    const readyOk = readyRes.status === 'fulfilled' && readyRes.value.ok
    const healthPayload = healthRes.status === 'fulfilled'
      ? await healthRes.value.json().catch(() => ({}))
      : {}
    const statusPayload = statusRes.status === 'fulfilled'
      ? await statusRes.value.json().catch(() => ({}))
      : {}

    const runtimeVersion = typeof healthPayload?.version === 'string'
      ? healthPayload.version
      : DEFAULT_OPENCLAW_VERSION
    const ffmpeg = {
      available: Boolean(statusPayload?.runtime?.ffmpeg?.available),
      version: typeof statusPayload?.runtime?.ffmpeg?.version === 'string'
        ? statusPayload.runtime.ffmpeg.version
        : null,
    }

    if (healthOk && readyOk) {
      return { status: 'running', openclawVersion: runtimeVersion, ffmpeg }
    }

    if (healthOk) {
      return { status: 'starting', openclawVersion: runtimeVersion, ffmpeg }
    }

    return { status: 'unknown', openclawVersion: runtimeVersion, ffmpeg }
  } catch {
    return {
      status: 'unknown',
      openclawVersion: DEFAULT_OPENCLAW_VERSION,
      ffmpeg: { available: false, version: null },
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  const ownershipResult = await verifyInstanceOwnership(userId)
  if (ownershipResult === 'no_session') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  if (ownershipResult === 'no_instance') {
    return NextResponse.json({ error: 'No instance found. Please deploy first.' }, { status: 404 })
  }
  if (!ownershipResult) {
    return NextResponse.json({ error: 'No instance found. Please deploy first.' }, { status: 404 })
  }

  const ownedUser = await prisma.user.findFirst({
    where: { openclawInstanceId: userId },
    select: {
      id: true,
      openclawUrl: true,
      plan: true,
      subscriptionStatus: true,
    },
  })
  const persistedUrl = ownedUser?.openclawUrl || `https://agentbot-agent-${userId}-production.up.railway.app`
  const [registration, latestAgent] = ownedUser?.id
    ? await Promise.all([
        prisma.$queryRaw<
          { registered_at: Date | null; last_seen: Date | null; status: string | null }[]
        >`
          SELECT registered_at, last_seen, status
          FROM agent_registrations
          WHERE user_id = ${ownedUser.id}
          LIMIT 1
        `,
        prisma.agent.findFirst({
          where: { userId: ownedUser.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ])
    : [[], null]

  const runtime = await probeRuntime(persistedUrl)
  return NextResponse.json({
    userId,
    status: runtime.status,
    startedAt: registration[0]?.registered_at?.toISOString() || latestAgent?.createdAt?.toISOString() || null,
    subdomain: new URL(persistedUrl).host,
    url: persistedUrl,
    plan: ownedUser?.plan || 'free',
    openclawVersion: runtime.openclawVersion || DEFAULT_OPENCLAW_VERSION,
    ffmpegAvailable: runtime.ffmpeg?.available || false,
    ffmpegVersion: runtime.ffmpeg?.version || null,
    provisionedAt: registration[0]?.registered_at?.toISOString() || latestAgent?.createdAt?.toISOString() || null,
    lastSeenAt: registration[0]?.last_seen?.toISOString() || null,
    gatewayProcessStatus: registration[0]?.status || null,
    subscriptionStatus: ownedUser?.subscriptionStatus || null,
  })
}


export const dynamic = 'force-dynamic';
