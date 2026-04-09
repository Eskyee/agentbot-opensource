import { NextRequest, NextResponse } from 'next/server'
import { verifyInstanceOwnership } from '../_auth'
import { prisma } from '@/app/lib/prisma'
import { DEFAULT_OPENCLAW_VERSION } from '@/app/lib/openclaw-version'

async function probeRuntime(url: string) {
  const normalized = String(url).replace(/\/$/, '')

  try {
    const [healthRes, readyRes] = await Promise.allSettled([
      fetch(`${normalized}/healthz`, {
        signal: AbortSignal.timeout(5000),
        cache: 'no-store',
      }),
      fetch(`${normalized}/readyz`, {
        signal: AbortSignal.timeout(4000),
        cache: 'no-store',
      }),
    ])

    const healthOk = healthRes.status === 'fulfilled' && healthRes.value.ok
    const readyOk = readyRes.status === 'fulfilled' && readyRes.value.ok
    const healthPayload = healthRes.status === 'fulfilled'
      ? await healthRes.value.json().catch(() => ({}))
      : {}

    const runtimeVersion = typeof healthPayload?.version === 'string'
      ? healthPayload.version
      : DEFAULT_OPENCLAW_VERSION

    if (healthOk && readyOk) {
      return { status: 'running', openclawVersion: runtimeVersion }
    }

    if (healthOk) {
      return { status: 'starting', openclawVersion: runtimeVersion }
    }

    return { status: 'unknown', openclawVersion: runtimeVersion }
  } catch {
    return { status: 'unknown', openclawVersion: DEFAULT_OPENCLAW_VERSION }
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
    select: { openclawUrl: true, plan: true },
  })
  const persistedUrl = ownedUser?.openclawUrl || `https://agentbot-agent-${userId}-production.up.railway.app`

  const runtime = await probeRuntime(persistedUrl)
  return NextResponse.json({
    userId,
    status: runtime.status,
    startedAt: new Date().toISOString(),
    subdomain: new URL(persistedUrl).host,
    url: persistedUrl,
    plan: ownedUser?.plan || 'free',
    openclawVersion: runtime.openclawVersion || DEFAULT_OPENCLAW_VERSION,
  })
}


export const dynamic = 'force-dynamic';
