/**
 * Railway-direct provisioning — creates OpenClaw agent containers via Railway GraphQL API.
 *
 * Used by /api/provision when the backend Express service is unavailable.
 * Mirrors agentbot-backend/src/lib/container-manager.ts but runs in the Next.js edge/serverless env.
 *
 * Required env vars (set in Vercel project settings):
 *   RAILWAY_API_KEY         — Railway API token
 *   RAILWAY_PROJECT_ID      — Railway project ID
 *   RAILWAY_ENVIRONMENT_ID  — Railway environment ID
 */

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'
const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:latest'

function getAgentEnvVars(userId: string, plan: string): Record<string, string> {
  return {
    OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN || '',
    OPENCLAW_GATEWAY_URL:   process.env.OPENCLAW_GATEWAY_URL   || '',
    AGENTBOT_USER_ID:       userId,
    AGENTBOT_PLAN:          plan,
    AGENTBOT_API_URL:       process.env.BACKEND_API_URL        || '',
    DATABASE_URL:           process.env.DATABASE_URL           || '',
    OPENROUTER_API_KEY:     process.env.OPENROUTER_API_KEY     || '',
    INTERNAL_API_KEY:       process.env.INTERNAL_API_KEY       || '',
    WALLET_ENCRYPTION_KEY:  process.env.WALLET_ENCRYPTION_KEY  || '',
    NODE_ENV:               'production',
    PORT:                   '3001',
  }
}

async function railwayGql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const key = process.env.RAILWAY_API_KEY
  if (!key) throw new Error('RAILWAY_API_KEY not configured')

  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Railway API ${res.status}: ${text}`)
  }

  const json = await res.json() as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) {
    throw new Error(`Railway GQL: ${json.errors.map(e => e.message).join(', ')}`)
  }
  return json.data as T
}

export interface ProvisionResult {
  agentId: string
  url: string
  serviceId: string
  status: 'deploying'
}

/**
 * Provision a new OpenClaw container on Railway.
 * Returns immediately once the service is created and deploy triggered.
 */
export async function provisionOnRailway(
  agentId: string,
  plan: string = 'solo'
): Promise<ProvisionResult> {
  const projectId     = process.env.RAILWAY_PROJECT_ID?.trim()
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID?.trim()

  if (!projectId)     throw new Error('RAILWAY_PROJECT_ID not configured')
  if (!environmentId) throw new Error('RAILWAY_ENVIRONMENT_ID not configured')

  const serviceName = `agentbot-agent-${agentId}`

  // 1. Create service
  const created = await railwayGql<{ serviceCreate: { id: string; name: string } }>(`
    mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) { id name }
    }
  `, {
    input: {
      projectId,
      name: serviceName,
      source: { image: OPENCLAW_IMAGE },
    },
  })

  const serviceId = created.serviceCreate.id
  console.log(`[RailwayProvision] Created service ${serviceId} (${serviceName}) for ${agentId}`)

  // 2. Inject env vars
  const variables = getAgentEnvVars(agentId, plan)
  await railwayGql(`
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: { projectId, environmentId, serviceId, variables },
  })

  // 3. Trigger deploy
  await railwayGql(`
    mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `, { serviceId, environmentId })

  const url = `https://${serviceName}.up.railway.app`
  console.log(`[RailwayProvision] Deploy triggered → ${url}`)

  return { agentId, url, serviceId, status: 'deploying' }
}

/** Returns true if Railway env vars are present so direct provisioning can be used. */
export function isRailwayConfigured(): boolean {
  return Boolean(
    process.env.RAILWAY_API_KEY &&
    process.env.RAILWAY_PROJECT_ID &&
    process.env.RAILWAY_ENVIRONMENT_ID
  )
}
