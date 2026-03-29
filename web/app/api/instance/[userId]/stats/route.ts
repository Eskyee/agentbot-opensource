import { NextRequest, NextResponse } from 'next/server'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'
import { verifyInstanceOwnership } from '../../_auth'

const OPENCLAW_IMAGE_VERSION = '2026.3.24'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const BACKEND_API_URL = getBackendApiUrl()
  const { userId } = await params
  if (!(await verifyInstanceOwnership(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const INTERNAL_API_KEY = getInternalApiKey()

  // Try backend API first
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/agents/${userId}`, {
      headers: { Authorization: `Bearer ${INTERNAL_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        userId,
        cpu: data?.cpu || 'unknown',
        memory: data?.memory || 'unknown',
        status: data?.status || 'unknown',
        plan: data?.plan || 'free',
        openclawVersion: data?.openclawVersion || OPENCLAW_IMAGE_VERSION,
        health: data?.health || 'unknown',
        uptime: data?.uptime,
        messages: data?.messages,
        errors: data?.errors,
      })
    }
  } catch {
    // Backend unavailable — fall through to Railway agent health check
  }

  // Fallback: check the agent's own Railway container for health
  const railwayUrl = `https://agentbot-agent-${userId}-production.up.railway.app`
  try {
    const healthRes = await fetch(`${railwayUrl}/healthz`, {
      signal: AbortSignal.timeout(5000),
    })
    const healthData = await healthRes.json().catch(() => null)
    const isHealthy = healthRes.ok && healthData?.ok === true

    // Try readyz too
    let isReady = false
    try {
      const readyRes = await fetch(`${railwayUrl}/readyz`, {
        signal: AbortSignal.timeout(3000),
      })
      const readyData = await readyRes.json().catch(() => null)
      isReady = readyRes.ok && readyData?.ready === true
    } catch { /* not critical */ }

    return NextResponse.json({
      userId,
      status: isHealthy ? 'running' : 'unreachable',
      health: isHealthy ? (isReady ? 'healthy' : 'degraded') : 'unreachable',
      cpu: isHealthy ? '—' : '0%',
      memory: isHealthy ? '—' : '0MB',
      uptime: isHealthy ? 'active' : 'unknown',
      openclawVersion: OPENCLAW_IMAGE_VERSION,
    })
  } catch {
    // Both backend and agent unreachable
    return NextResponse.json({
      userId,
      cpu: '0%',
      memory: '0MB',
      status: 'unknown',
      health: 'unreachable',
      error: 'Stats service unavailable',
    })
  }
}

export const dynamic = 'force-dynamic';
