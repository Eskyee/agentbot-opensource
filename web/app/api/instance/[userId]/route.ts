import { NextRequest, NextResponse } from 'next/server'
import { verifyInstanceOwnership } from '../_auth'
import { prisma } from '@/app/lib/prisma'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'

type ProbeCheck = {
  path: string
  ok: boolean
  status: number | null
  reason: string | null
}

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
    const statusOk = statusRes.status === 'fulfilled' && statusRes.value.ok
    const checks: ProbeCheck[] = [
      {
        path: '/healthz',
        ok: healthOk,
        status: healthRes.status === 'fulfilled' ? healthRes.value.status : null,
        reason: healthRes.status === 'rejected'
          ? healthRes.reason instanceof Error ? healthRes.reason.message : 'request failed'
          : healthRes.value.ok ? null : `HTTP ${healthRes.value.status}`,
      },
      {
        path: '/readyz',
        ok: readyOk,
        status: readyRes.status === 'fulfilled' ? readyRes.value.status : null,
        reason: readyRes.status === 'rejected'
          ? readyRes.reason instanceof Error ? readyRes.reason.message : 'request failed'
          : readyRes.value.ok ? null : `HTTP ${readyRes.value.status}`,
      },
      {
        path: '/api/status',
        ok: statusOk,
        status: statusRes.status === 'fulfilled' ? statusRes.value.status : null,
        reason: statusRes.status === 'rejected'
          ? statusRes.reason instanceof Error ? statusRes.reason.message : 'request failed'
          : statusRes.value.ok ? null : `HTTP ${statusRes.value.status}`,
      },
    ]
    const healthPayload = healthRes.status === 'fulfilled'
      ? await healthRes.value.json().catch(() => ({}))
      : {}
    const statusPayload = statusRes.status === 'fulfilled'
      ? await statusRes.value.json().catch(() => ({}))
      : {}

    const runtimeVersion = typeof healthPayload?.version === 'string'
      ? healthPayload.version
      : typeof statusPayload?.version === 'string'
        ? statusPayload.version
      : DEFAULT_OPENCLAW_VERSION
    const ffmpeg = {
      available: Boolean(statusPayload?.runtime?.ffmpeg?.available),
      version: typeof statusPayload?.runtime?.ffmpeg?.version === 'string'
        ? statusPayload.runtime.ffmpeg.version
        : null,
    }
    const configured = statusPayload?.configured
    const state = typeof statusPayload?.state === 'string' ? statusPayload.state : null
    const running = statusPayload?.running === true
    const reason = !statusOk
      ? checks.find((check) => check.path === '/api/status')?.reason || 'status endpoint unavailable'
      : configured === false
        ? 'runtime reachable but setup not completed'
        : state === 'stopped' || running === false
          ? 'runtime reachable but process is stopped'
          : !healthOk && !readyOk
            ? 'legacy health probes unavailable; using /api/status'
            : null

    if (statusOk) {
      if (configured === false) {
        return { status: 'setup', openclawVersion: runtimeVersion, ffmpeg, checks, reason }
      }

      if (running || state === 'running') {
        return { status: 'running', openclawVersion: runtimeVersion, ffmpeg, checks, reason }
      }

      if (state === 'stopped' || running === false) {
        return { status: 'stopped', openclawVersion: runtimeVersion, ffmpeg, checks, reason }
      }
    }

    if (healthOk && readyOk) {
      return { status: 'running', openclawVersion: runtimeVersion, ffmpeg, checks, reason: null }
    }

    if (healthOk) {
      return { status: 'starting', openclawVersion: runtimeVersion, ffmpeg, checks, reason: 'healthz is up but readyz is not ready yet' }
    }

    return { status: 'unknown', openclawVersion: runtimeVersion, ffmpeg, checks, reason: 'runtime did not answer the expected probes' }
  } catch (error) {
    return {
      status: 'unknown',
      openclawVersion: DEFAULT_OPENCLAW_VERSION,
      ffmpeg: { available: false, version: null },
      checks: [
        { path: '/healthz', ok: false, status: null, reason: 'probe not executed' },
        { path: '/readyz', ok: false, status: null, reason: 'probe not executed' },
        { path: '/api/status', ok: false, status: null, reason: error instanceof Error ? error.message : 'probe failed' },
      ],
      reason: error instanceof Error ? error.message : 'runtime probe failed',
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
    statusReason: runtime.reason || null,
    probeChecks: runtime.checks || [],
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  const ownershipResult = await verifyInstanceOwnership(userId)
  if (ownershipResult === 'no_session') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  if (!ownershipResult || ownershipResult === 'no_instance') {
    return NextResponse.json({ error: 'No instance found. Please deploy first.' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const action = typeof body?.action === 'string' ? body.action : 'probe'

  const ownedUser = await prisma.user.findFirst({
    where: { openclawInstanceId: userId },
    select: {
      id: true,
      openclawUrl: true,
      openclawInstanceId: true,
    },
  })

  if (!ownedUser?.id) {
    return NextResponse.json({ error: 'Runtime owner not found' }, { status: 404 })
  }

  if (action === 'resync') {
    const syncResult = await maybeAutoSyncManagedRuntimeForUser(ownedUser.id).catch((error) => ({
      attempted: true,
      synced: false,
      reason: error instanceof Error ? error.message : 'resync failed',
    }))

    return NextResponse.json({
      success: true,
      action: 'resync',
      syncResult,
    })
  }

  const persistedUrl = ownedUser.openclawUrl || `https://agentbot-agent-${userId}-production.up.railway.app`
  const runtime = await probeRuntime(persistedUrl)

  return NextResponse.json({
    success: true,
    action: 'probe',
    status: runtime.status,
    statusReason: runtime.reason || null,
    probeChecks: runtime.checks || [],
    url: persistedUrl,
  })
}


export const dynamic = 'force-dynamic';
