import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'
const RAILWAY_TOKEN = process.env.RAILWAY_API_KEY || ''

/**
 * POST /api/instance/[userId]/repair
 * Full reconfigure: rewrite config env vars and restart.
 * Fixes broken tokens, config corruption, stuck containers.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawInstanceId: true, plan: true },
  })

  if (!user?.openclawInstanceId) {
    return NextResponse.json({ success: false, error: 'No instance found' }, { status: 404 })
  }

  try {
    // Re-inject all env vars (fixes corrupted/missing vars)
    const variables = {
      OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN || '',
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
    await fetch(RAILWAY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query: `mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }`,
        variables: {
          input: {
            serviceId: user.openclawInstanceId,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID || '',
            variables: envEntries,
          },
        },
      }),
    })

    // Restart after env update
    await fetch(RAILWAY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query: `mutation ServiceInstanceRestart($serviceId: String!, $environmentId: String!) {
          serviceInstanceRestart(serviceId: $serviceId, environmentId: $environmentId)
        }`,
        variables: {
          serviceId: user.openclawInstanceId,
          environmentId: process.env.RAILWAY_ENVIRONMENT_ID || '',
        },
      }),
    })

    return NextResponse.json({ success: true, status: 'repaired' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
