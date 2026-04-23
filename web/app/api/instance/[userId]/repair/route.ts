import { NextResponse } from 'next/server'
import { controlsDisabledResponse, getOwnedOpenClawUser, OPENCLAW_CONTROLS_ENABLED } from '@/app/api/instance/_runtime'
import { getRailwayEnvironmentId, railwayGql, resolveRailwayService } from '@/app/lib/railway-service'
import { getAgentEnvVars } from '@/app/lib/railway-provision'
import { prisma } from '@/app/lib/prisma'

/**
 * POST /api/instance/[userId]/repair
 * Full reconfigure: rewrite config env vars and restart.
 * Fixes broken tokens, config corruption, stuck containers.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!OPENCLAW_CONTROLS_ENABLED) {
    return controlsDisabledResponse()
  }

  const { userId } = await params
  const owned = await getOwnedOpenClawUser(userId)
  if ('error' in owned) {
    return owned.error
  }
  const { user } = owned
  let environmentId: string
  let railwayService: Awaited<ReturnType<typeof resolveRailwayService>>
  try {
    environmentId = getRailwayEnvironmentId()
    railwayService = await resolveRailwayService({
      agentId: user.openclawInstanceId,
      openclawUrl: user.openclawUrl,
      serviceId: user.runtimeServiceId,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 503 })
  }

  // Get user's unique token from database
  const registration = await prisma.$queryRaw<{ gateway_token: string }[]>`
    SELECT gateway_token FROM agent_registrations WHERE user_id = ${user.id} LIMIT 1
  `
  const userGatewayToken = registration[0]?.gateway_token || crypto.randomUUID()

  try {
    const variables = getAgentEnvVars(user.id, user.plan || 'solo', userGatewayToken)

    // Update env vars on Railway
    await railwayGql(
      `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }`,
      {
        input: {
          projectId: process.env.RAILWAY_PROJECT_ID?.trim(),
          serviceId: railwayService.id,
          environmentId,
          variables,
        },
      }
    )

    // Restart after env update
    await railwayGql(
      `mutation ServiceInstanceRestart($serviceId: String!, $environmentId: String!) {
        serviceInstanceRestart(serviceId: $serviceId, environmentId: $environmentId)
      }`,
      {
        serviceId: railwayService.id,
        environmentId,
      }
    )

    return NextResponse.json({ success: true, status: 'repaired' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
