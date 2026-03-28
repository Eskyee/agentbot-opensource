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

/**
 * OpenClaw TCP proxy start command.
 *
 * OpenClaw Gateway hardcodes loopback (127.0.0.1:18789). Railway's load balancer
 * needs the container to accept on PORT (Railway injects this). This Node.js one-liner:
 *   1. Spawns `openclaw gateway --allow-unconfigured` in the background
 *   2. After 3s starts a TCP proxy: PORT → 127.0.0.1:18789
 * No shell operators, no quoting issues — pure Node.js.
 */
const OPENCLAW_START_CMD =
  `node -e "const{spawn}=require('child_process');const p=spawn('openclaw',['gateway','--allow-unconfigured'],{stdio:'inherit'});p.on('error',e=>console.error('openclaw err:',e));setTimeout(()=>{require('net').createServer(s=>{const c=require('net').connect(18789,'127.0.0.1',()=>{s.pipe(c);c.pipe(s)});c.on('error',()=>s.destroy())}).listen(parseInt(process.env.PORT)||8080,'0.0.0.0',()=>console.log('tcp proxy on port',process.env.PORT||8080))},3000)"`

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
    // PORT is injected by Railway — the TCP proxy listens here and forwards to 18789
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

  // 1b. Set start command — TCP proxy bridges PORT → openclaw loopback 18789
  await railwayGql(`
    mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }
  `, {
    serviceId,
    environmentId,
    input: { startCommand: OPENCLAW_START_CMD },
  })
  console.log(`[RailwayProvision] Start command set for ${serviceId}`)

  // 2. Inject env vars
  const variables = getAgentEnvVars(agentId, plan)
  await railwayGql(`
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: { projectId, environmentId, serviceId, variables },
  })

  // 3. Generate public domain (must happen before deploy)
  let url = `https://${serviceName}.up.railway.app`
  try {
    const domainResult = await railwayGql<{
      serviceDomainCreate: { domain: string }
    }>(`
      mutation ServiceDomainCreate($input: ServiceDomainCreateInput!) {
        serviceDomainCreate(input: $input) { domain }
      }
    `, { input: { serviceId, environmentId } })
    const domain = domainResult.serviceDomainCreate.domain
    url = domain.startsWith('http') ? domain : `https://${domain}`
    console.log(`[RailwayProvision] Domain generated: ${url}`)
  } catch (domainErr) {
    console.warn(`[RailwayProvision] Domain generation failed, using default URL:`, domainErr)
  }

  // 4. Trigger deploy
  await railwayGql(`
    mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `, { serviceId, environmentId })

  // The container runs a TCP proxy (PORT → 127.0.0.1:18789) so the Railway
  // public domain is directly accessible. No backend proxy needed.
  console.log(`[RailwayProvision] Deploy triggered → url: ${url}`)

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
