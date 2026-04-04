import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys'

export const dynamic = 'force-dynamic'

const KNOWN_GOOD_IMAGE = 'ghcr.io/openclaw/openclaw:2026.3.28'

async function getOpenClawInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawUrl: true, openclawInstanceId: true },
  })
  return user
}

/**
 * GET /api/openclaw/maintenance
 * Returns health status for the user's OpenClaw container.
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const info = await getOpenClawInfo(session.user.id)
  if (!info?.openclawInstanceId) {
    return NextResponse.json({ status: 'no_agent', healthy: false, ready: false })
  }

  const instanceId = info.openclawInstanceId
  const railwayUrl = info.openclawUrl || `https://agentbot-agent-${instanceId}-production.up.railway.app`

  const result = {
    instanceId,
    railwayUrl,
    healthy: false,
    ready: false,
    version: null as string | null,
    uptime: null as string | null,
    status: 'unknown' as string,
  }

  // Check /healthz
  try {
    const r = await fetch(`${railwayUrl}/healthz`, { signal: AbortSignal.timeout(5000) })
    const d = await r.json().catch(() => ({}))
    result.healthy = r.ok && (d?.ok === true || r.ok)
    result.version = d?.version || null
    result.uptime = d?.uptime || null
  } catch {
    result.healthy = false
  }

  // Check /readyz
  try {
    const r = await fetch(`${railwayUrl}/readyz`, { signal: AbortSignal.timeout(4000) })
    const d = await r.json().catch(() => ({}))
    result.ready = r.ok && (d?.ready === true || r.ok)
  } catch {
    result.ready = false
  }

  result.status = result.healthy && result.ready ? 'healthy' : result.healthy ? 'starting' : 'unreachable'

  return NextResponse.json(result)
}

/**
 * POST /api/openclaw/maintenance
 * Body: { action: 'restart' | 'factory-reset' }
 * - restart: restarts container (doctor --fix runs on startup)
 * - factory-reset: pins to known-good image, reconfigures env, restarts
 */
export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const info = await getOpenClawInfo(session.user.id)
  if (!info?.openclawInstanceId) {
    return NextResponse.json({ error: 'No agent deployed' }, { status: 404 })
  }

  const instanceId = info.openclawInstanceId

  let body: { action?: string } = {}
  try {
    body = await request.json()
  } catch {
    // no body = restart
  }

  let BACKEND_API_URL: string
  let INTERNAL_API_KEY: string
  try {
    BACKEND_API_URL = getBackendApiUrl()
    INTERNAL_API_KEY = getInternalApiKey()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server misconfiguration'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  try {
    if (body.action === 'factory-reset') {
      // Step 1: Update to known-good image
      const updateRes = await fetch(`${BACKEND_API_URL}/api/agents/${instanceId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
        body: JSON.stringify({ image: KNOWN_GOOD_IMAGE }),
        signal: AbortSignal.timeout(120000),
      })

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}))
        return NextResponse.json({ error: 'Factory reset failed during update', details: errData }, { status: 502 })
      }

      return NextResponse.json({
        success: true,
        message: `Factory reset complete — pinned to ${KNOWN_GOOD_IMAGE}. Agent restarting with doctor --fix.`,
        image: KNOWN_GOOD_IMAGE,
      })
    }

    // Default: restart
    const res = await fetch(`${BACKEND_API_URL}/api/agents/${instanceId}/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Restart failed', details: res.status }, { status: 502 })
    }

    return NextResponse.json({ success: true, message: 'Agent restarting — doctor & migrations run on startup' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
