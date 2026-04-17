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
  const railwayUrl = info.openclawUrl || `https://agentbot-agent-${instanceId}YOUR_SERVICE_URL`

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
