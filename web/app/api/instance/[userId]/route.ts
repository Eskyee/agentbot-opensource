import { NextRequest, NextResponse } from 'next/server'
import { verifyInstanceOwnership } from '../_auth'
import { prisma } from '@/app/lib/prisma'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'
import { probeOpenClawRuntime } from '@/app/lib/openclaw-runtime-probe'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'

function getRuntimeHost(url: string, fallback: string) {
  try {
    return new URL(url).host || fallback
  } catch {
    return fallback
  }
}

async function clearMissingRuntime(userId: string, instanceId: string) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        openclawInstanceId: null,
        openclawUrl: null,
      },
    }),
    prisma.agent.updateMany({
      where: { id: instanceId, userId },
      data: {
        status: 'error',
        websocketUrl: null,
        config: {
          runtimeError: `Railway application missing for stale runtime id ${instanceId}`,
          runtimeMissingAt: new Date().toISOString(),
        },
      },
    }),
  ])
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
  const persistedUrl = ownedUser?.openclawUrl || `https://agentbot-agent-${userId}YOUR_SERVICE_URL`
  const runtimeHost = getRuntimeHost(persistedUrl, `agentbot-agent-${userId}YOUR_SERVICE_URL`)
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

  const runtime = await probeOpenClawRuntime(persistedUrl)

  if (runtime.reason?.includes('Application not found') && ownedUser?.id) {
    await clearMissingRuntime(ownedUser.id, userId)
    return NextResponse.json({ error: 'No instance found. Please deploy first.' }, { status: 404 })
  }

  return NextResponse.json({
    userId,
    status: runtime.status,
    statusReason: runtime.reason || null,
    probeChecks: runtime.checks || [],
    startedAt: registration[0]?.registered_at?.toISOString() || latestAgent?.createdAt?.toISOString() || null,
    subdomain: runtimeHost,
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

  const persistedUrl = ownedUser.openclawUrl || `https://agentbot-agent-${userId}YOUR_SERVICE_URL`
  const runtime = await probeOpenClawRuntime(persistedUrl)

  if (runtime.reason?.includes('Application not found')) {
    await clearMissingRuntime(ownedUser.id, userId)
    return NextResponse.json({
      success: false,
      action: 'probe',
      error: 'No instance found. Please deploy first.',
    }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    action: 'probe',
    status: runtime.status,
    statusReason: runtime.reason || null,
    probeChecks: runtime.checks || [],
    url: persistedUrl,
  })
}

