import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getAgentEnvVars } from '@/app/lib/railway-provision'
import { getRailwayEnvironmentId, getRailwayProjectId, railwayGql, resolveRailwayService } from '@/app/lib/railway-service'
import { DEFAULT_OPENCLAW_IMAGE } from '@/app/lib/openclaw-version'
import { OPENCLAW_CONTROLS_ENABLED, controlsDisabledResponse } from '@/app/api/instance/_runtime'

export const dynamic = 'force-dynamic'

const KNOWN_GOOD_IMAGE = DEFAULT_OPENCLAW_IMAGE

async function getOpenClawInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawUrl: true, openclawInstanceId: true, plan: true },
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
    statusReason: null as string | null,
    checks: [] as Array<{ path: string; ok: boolean; status: number | null; reason: string | null }>,
  }

  // Check /healthz
  try {
    const r = await fetch(`${railwayUrl}/healthz`, { signal: AbortSignal.timeout(5000) })
    const d = await r.json().catch(() => ({}))
    result.healthy = r.ok && (d?.ok === true || r.ok)
    result.version = d?.version || null
    result.uptime = d?.uptime || null
    result.checks.push({
      path: '/healthz',
      ok: r.ok,
      status: r.status,
      reason: r.ok ? null : `HTTP ${r.status}`,
    })
  } catch {
    result.healthy = false
    result.checks.push({
      path: '/healthz',
      ok: false,
      status: null,
      reason: 'request failed',
    })
  }

  // Check /readyz
  try {
    const r = await fetch(`${railwayUrl}/readyz`, { signal: AbortSignal.timeout(4000) })
    const d = await r.json().catch(() => ({}))
    result.ready = r.ok && (d?.ready === true || r.ok)
    result.checks.push({
      path: '/readyz',
      ok: r.ok,
      status: r.status,
      reason: r.ok ? null : `HTTP ${r.status}`,
    })
  } catch {
    result.ready = false
    result.checks.push({
      path: '/readyz',
      ok: false,
      status: null,
      reason: 'request failed',
    })
  }

  try {
    const statusRes = await fetch(`${railwayUrl}/api/status`, { signal: AbortSignal.timeout(5000) })
    const statusData = await statusRes.json().catch(() => ({}))
    result.checks.push({
      path: '/api/status',
      ok: statusRes.ok,
      status: statusRes.status,
      reason: statusRes.ok ? null : `HTTP ${statusRes.status}`,
    })

    if (statusRes.ok) {
      if (statusData?.configured === false) {
        result.status = 'setup'
        result.statusReason = 'Runtime reachable but setup is not complete'
      } else if (statusData?.running === true || statusData?.state === 'running') {
        result.status = 'healthy'
        result.statusReason = null
      } else if (statusData?.state === 'stopped' || statusData?.running === false) {
        result.status = 'stopped'
        result.statusReason = 'Runtime reachable but process is stopped'
      } else {
        result.status = result.healthy && result.ready ? 'healthy' : result.healthy ? 'starting' : 'unknown'
        result.statusReason = 'Runtime reachable but returned a non-standard state'
      }
      result.version = result.version || statusData?.version || null
      result.uptime = result.uptime || statusData?.uptime || null
      return NextResponse.json(result)
    }
  } catch {
    result.checks.push({
      path: '/api/status',
      ok: false,
      status: null,
      reason: 'request failed',
    })
    // fall back to legacy healthz / readyz logic below
  }

  result.status = result.healthy && result.ready ? 'healthy' : result.healthy ? 'starting' : 'unreachable'
  result.statusReason = result.status === 'unreachable'
    ? 'Runtime did not answer /api/status and the legacy probes were not healthy'
    : result.status === 'starting'
      ? 'Health probe is up but readiness is not complete'
      : null

  return NextResponse.json(result)
}

/**
 * POST /api/openclaw/maintenance
 * Body: { action: 'restart' | 'factory-reset' }
 * - restart: restarts container (doctor --fix runs on startup)
 * - factory-reset: pins to known-good image, reconfigures env, restarts
 */
export async function POST(request: Request) {
  if (!OPENCLAW_CONTROLS_ENABLED) {
    return controlsDisabledResponse()
  }

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

  let environmentId: string
  let projectId: string
  let railwayService: Awaited<ReturnType<typeof resolveRailwayService>>
  try {
    environmentId = getRailwayEnvironmentId()
    projectId = getRailwayProjectId()
    railwayService = await resolveRailwayService({
      agentId: info.openclawInstanceId,
      openclawUrl: info.openclawUrl,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Railway configuration error'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  try {
    if (body.action === 'factory-reset') {
      await railwayGql(
        `mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
          serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
        }`,
        {
          serviceId: railwayService.id,
          environmentId,
          input: {
            source: { image: KNOWN_GOOD_IMAGE },
          },
        }
      )

      await railwayGql(
        `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }`,
        {
          input: {
            projectId,
            environmentId,
            serviceId: railwayService.id,
            variables: getAgentEnvVars(session.user.id, info.plan || 'solo'),
          },
        }
      )

      await railwayGql(
        `mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
          serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
        }`,
        {
          serviceId: railwayService.id,
          environmentId,
        }
      )

      return NextResponse.json({
        success: true,
        message: `Factory reset complete — pinned to ${KNOWN_GOOD_IMAGE}. Agent restarting with doctor --fix.`,
        image: KNOWN_GOOD_IMAGE,
        serviceId: railwayService.id,
      })
    }

    await railwayGql(
      `mutation ServiceInstanceRestart($serviceId: String!, $environmentId: String!) {
        serviceInstanceRestart(serviceId: $serviceId, environmentId: $environmentId)
      }`,
      {
        serviceId: railwayService.id,
        environmentId,
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Agent restarting — doctor & migrations run on startup',
      serviceId: railwayService.id,
      instanceId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
