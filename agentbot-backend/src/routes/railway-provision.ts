/**
 * Railway provisioning proxy — forwards provision requests to Railway GraphQL API.
 *
 * This route exists because direct calls from Vercel serverless functions to
 * backboard.railway.app/graphql/v2 return 403. The backend runs on Railway
 * so its outbound requests to Railway API succeed.
 *
 * POST /api/railway/provision
 *   Body: { agentId, plan, userId }
 *   Returns: { success, agentId, url, serviceId, status }
 *
 * Auth: Bearer INTERNAL_API_KEY (same as all internal routes)
 */

import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { DEFAULT_OPENCLAW_IMAGE } from '../lib/openclaw-version'

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'
const OPENCLAW_IMAGE = DEFAULT_OPENCLAW_IMAGE

function getAgentEnvVars(agentId: string, plan: string): Record<string, string> {
  return {
    OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN || '',
    OPENCLAW_GATEWAY_URL: process.env.OPENCLAW_GATEWAY_URL || '',
    AGENTBOT_USER_ID: agentId,
    AGENTBOT_PLAN: plan,
    AGENTBOT_API_URL: process.env.BACKEND_API_URL || '',
    DATABASE_URL: process.env.DATABASE_URL || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || '',
    WALLET_ENCRYPTION_KEY: process.env.WALLET_ENCRYPTION_KEY || '',
    NODE_ENV: 'production',
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
      'Accept': 'application/json',
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
    throw new Error(`Railway GQL: ${json.errors.map((e: { message: string }) => e.message).join(', ')}`)
  }
  return json.data as T
}

const PLAN_LIMITS: Record<string, { memoryLimitMb: number; cpuLimit: number }> = {
  underground: { memoryLimitMb: 2048, cpuLimit: 1 },
  solo: { memoryLimitMb: 2048, cpuLimit: 1 },
  collective: { memoryLimitMb: 4096, cpuLimit: 2 },
  label: { memoryLimitMb: 8192, cpuLimit: 4 },
  network: { memoryLimitMb: 16384, cpuLimit: 4 },
}

export async function provisionOnRailway(agentId: string, plan: string = 'solo') {
  const projectId = process.env.RAILWAY_PROJECT_ID?.trim()
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID?.trim()

  if (!projectId) throw new Error('RAILWAY_PROJECT_ID not configured')
  if (!environmentId) throw new Error('RAILWAY_ENVIRONMENT_ID not configured')

  const serviceName = `agentbot-agent-${agentId}`

  // 1. Create service
  const created = await railwayGql<{ serviceCreate: { id: string; name: string } }>(`
    mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) { id name }
    }
  `, {
    input: { projectId, name: serviceName, source: { image: OPENCLAW_IMAGE } },
  })

  const serviceId = created.serviceCreate.id
  console.log(`[RailwayProvision] Created service ${serviceId} (${serviceName}) for ${agentId}`)

  // 2. Set resource limits + health check (no start command — image has CMD)
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.solo
  await railwayGql(`
    mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }
  `, {
    serviceId, environmentId,
    input: {
      memoryLimitMb: limits.memoryLimitMb,
      cpuLimit: limits.cpuLimit,
      healthcheckPath: '/healthz',
      healthcheckTimeout: 60,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
    },
  })

  // 2b. Add persistent volume for config/conversations
  try {
    await railwayGql(`
      mutation VolumeCreate($input: VolumeCreateInput!) {
        volumeCreate(input: $input) { id }
      }
    `, {
      input: { projectId, environmentId, serviceId, mountPath: '/data' },
    })
    console.log(`[RailwayProvision] Volume mounted at /data for ${serviceId}`)
  } catch (volErr) {
    console.warn(`[RailwayProvision] Volume creation failed (non-fatal):`, volErr)
  }

  // 3. Inject env vars
  const variables = getAgentEnvVars(agentId, plan)
  await railwayGql(`
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: { projectId, environmentId, serviceId, variables },
  })

  // 4. Generate public domain
  let url = `https://${serviceName}.up.railway.app`
  try {
    const domainResult = await railwayGql<{ serviceDomainCreate: { domain: string } }>(`
      mutation ServiceDomainCreate($input: ServiceDomainCreateInput!) {
        serviceDomainCreate(input: $input) { domain }
      }
    `, { input: { serviceId, environmentId } })
    const domain = domainResult.serviceDomainCreate.domain
    url = domain.startsWith('http') ? domain : `https://${domain}`
  } catch (err) {
    console.warn(`[RailwayProvision] Domain generation failed, using default:`, err)
  }

  // 5. Trigger deploy
  await railwayGql(`
    mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `, { serviceId, environmentId })

  console.log(`[RailwayProvision] Deploy triggered → ${url}`)
  return { agentId, url, serviceId, status: 'deploying' as const }
}

const router = Router()

router.post('/provision', authenticate, async (req: Request, res: Response) => {
  const { agentId, plan } = req.body

  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({ success: false, error: 'agentId required' })
  }

  // Safety: only allow agentbot-agent-* names
  if (!/^[0-9a-f]{16}$/.test(agentId)) {
    return res.status(400).json({ success: false, error: 'Invalid agentId format' })
  }

  const planStr = (typeof plan === 'string' ? plan : 'solo').toLowerCase()

  if (!process.env.RAILWAY_API_KEY) {
    return res.status(503).json({ success: false, error: 'Railway not configured on this backend' })
  }

  try {
    const result = await provisionOnRailway(agentId, planStr)
    return res.json({ success: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Railway provision failed'
    console.error('[RailwayProxy] Provision error:', message)
    return res.status(502).json({ success: false, error: message })
  }
})

export default router
