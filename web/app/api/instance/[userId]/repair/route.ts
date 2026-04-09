import { NextResponse } from 'next/server'
import { controlsDisabledResponse, getOwnedOpenClawUser, OPENCLAW_CONTROLS_ENABLED } from '@/app/api/instance/_runtime'
import { getRailwayEnvironmentId, railwayGql, resolveRailwayService } from '@/app/lib/railway-service'
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
  const environmentId = getRailwayEnvironmentId()
  const railwayService = await resolveRailwayService({
    agentId: user.openclawInstanceId,
    openclawUrl: user.openclawUrl,
  })

  // Get user's unique token from database
  const registration = await prisma.$queryRaw<{ gateway_token: string }[]>`
    SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId} LIMIT 1
  `
  const userGatewayToken = registration[0]?.gateway_token || crypto.randomUUID()

  try {
    // Re-inject all env vars (fixes corrupted/missing vars)
    // Use user's unique token, not the shared platform token
    const variables = {
      OPENCLAW_GATEWAY_TOKEN: userGatewayToken,
      OPENCLAW_GATEWAY_URL: process.env.OPENCLAW_GATEWAY_URL || '',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      AGENTBOT_USER_ID: userId,
      AGENTBOT_PLAN: user.plan,
      AGENTBOT_API_URL: process.env.BACKEND_API_URL || '',
      DATABASE_URL: process.env.DATABASE_URL || '',
      INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || '',
      WALLET_ENCRYPTION_KEY: process.env.WALLET_ENCRYPTION_KEY || '',
      NODE_ENV: 'production',
      PORT: '18789',
    }

    // Update env vars on Railway
    const envEntries = Object.entries(variables).map(([name, value]) => ({ name, value }))
    await railwayGql(
      `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }`,
      {
        input: {
          serviceId: railwayService.id,
          environmentId,
          variables: envEntries,
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
