import { NextRequest, NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '../../lib/api-keys'
import { verifyInstanceOwnership } from '../_auth'
import { prisma } from '@/app/lib/prisma'

const RUNTIME_VERSION = '2026.4.2'

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
      : RUNTIME_VERSION

    if (healthOk && readyOk) {
      return { status: 'running', openclawVersion: runtimeVersion }
    }

    if (healthOk) {
      return { status: 'starting', openclawVersion: runtimeVersion }
    }

    return { status: 'unknown', openclawVersion: runtimeVersion }
  } catch {
    return { status: 'unknown', openclawVersion: RUNTIME_VERSION }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const BACKEND_API_URL = getBackendApiUrl()
  const INTERNAL_API_KEY = getInternalApiKey()
  const { userId } = await params

  if (!(await verifyInstanceOwnership(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const ownedUser = await prisma.user.findFirst({
    where: { openclawInstanceId: userId },
    select: { openclawUrl: true },
  })
  const persistedUrl = ownedUser?.openclawUrl || `https://agentbot-agent-${userId}-production.up.railway.app`
  
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/agents/${userId}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`
      }
    })

    let data: any = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok || !data) {
      const runtime = await probeRuntime(persistedUrl)
      return NextResponse.json({
        userId,
        status: runtime.status,
        startedAt: new Date().toISOString(),
        subdomain: new URL(persistedUrl).host,
        url: persistedUrl,
        plan: 'free',
        openclawVersion: runtime.openclawVersion,
      }, { status: response.status || 502 })
    }

    const runtime = await probeRuntime(data.url || persistedUrl)
    const normalizedStatus = data.status === 'active'
      ? 'running'
      : data.status || runtime.status || 'unknown'
    const resolvedStatus = normalizedStatus === 'unknown' && runtime.status !== 'unknown'
      ? runtime.status
      : normalizedStatus

    return NextResponse.json({
      userId,
      status: resolvedStatus,
      startedAt: data.startedAt || new Date().toISOString(),
      subdomain: data.subdomain || new URL(persistedUrl).host,
      url: data.url || persistedUrl,
      plan: data.plan || 'free',
      openclawVersion: data.openclawVersion || runtime.openclawVersion || RUNTIME_VERSION
    })
  } catch (error) {
    const runtime = await probeRuntime(persistedUrl)
    return NextResponse.json({
      userId,
      status: runtime.status,
      startedAt: new Date().toISOString(),
      subdomain: new URL(persistedUrl).host,
      url: persistedUrl,
      plan: 'free',
      openclawVersion: runtime.openclawVersion
    }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';
