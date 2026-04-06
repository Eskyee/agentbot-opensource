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

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'

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
    // Railway routes public HTTP traffic to the PORT value.
    // openclaw gateway listens on 18789 — tell Railway to proxy there.
    PORT: '18789',
    // openclaw gateway defaults to loopback-only bind.
    // Railway's reverse proxy is external, so we must bind to all interfaces.
    // Auth is enforced via OPENCLAW_GATEWAY_TOKEN above.
    OPENCLAW_GATEWAY_BIND: 'lan',
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

  // 1. Create service — idempotent: if it already exists, look up its ID
  let serviceId: string
  // Public official openclaw image — ghcr.io/openclaw/openclaw is public, no registry auth required
  const openclawImage = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:2026.4.5'

  try {
    const created = await railwayGql<{ serviceCreate: { id: string; name: string } }>(`
      mutation ServiceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) { id name }
      }
    `, {
      input: { projectId, name: serviceName, source: { image: openclawImage } },
    })
    serviceId = created.serviceCreate.id
    console.log(`[RailwayProvision] Created service ${serviceId} (${serviceName}) for ${agentId}`)
  } catch (createErr: unknown) {
    const msg = createErr instanceof Error ? createErr.message : String(createErr)
    if (!msg.includes('already exists')) throw createErr

    // Service already exists (retry after partial failure) — look up its ID
    console.warn(`[RailwayProvision] Service already exists, looking up ID for ${serviceName}`)
    const lookup = await railwayGql<{ project: { services: { edges: { node: { id: string; name: string } }[] } } }>(`
      query ProjectServices($projectId: String!) {
        project(id: $projectId) { services { edges { node { id name } } } }
      }
    `, { projectId })
    const match = lookup.project.services.edges.find(e => e.node.name === serviceName)
    if (!match) throw new Error(`Service ${serviceName} reported as existing but not found in project`)
    serviceId = match.node.id
    console.log(`[RailwayProvision] Resuming with existing service ${serviceId}`)
  }

  // 2. Set resource limits + health check — non-fatal (Railway may reject some fields)
  // NOTE: no rootDirectory — that is a source/repo-build concept; image services don't use it
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.solo
  try {
    await railwayGql(`
      mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
        serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
      }
    `, {
      serviceId, environmentId,
      input: {
        memoryLimitMb: limits.memoryLimitMb,
        cpuLimit: limits.cpuLimit,
        healthcheckPath: '/api/status',
        healthcheckTimeout: 60,
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10,
      },
    })
    console.log(`[RailwayProvision] Set resource limits for ${serviceId}`)
  } catch (limitsErr) {
    console.warn(`[RailwayProvision] Resource limits update failed (non-fatal):`, limitsErr)
  }

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

  // 3. Inject env vars — retry once on failure (Railway occasionally rejects first upsert)
  const variables = getAgentEnvVars(agentId, plan)
  let varsSet = false
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await railwayGql(`
        mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }
      `, {
        input: { projectId, environmentId, serviceId, variables },
      })
      varsSet = true
      break
    } catch (varsErr) {
      console.warn(`[RailwayProvision] variableCollectionUpsert attempt ${attempt} failed:`, varsErr)
      if (attempt === 2) throw varsErr
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  console.log(`[RailwayProvision] Env vars set (varsSet=${varsSet}) for ${serviceId}`)

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

  // 5. Trigger deploy — non-fatal: Railway auto-deploys on env var change anyway
  try {
    await railwayGql(`
      mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `, { serviceId, environmentId })
    console.log(`[RailwayProvision] Deploy triggered → ${url}`)
  } catch (deployErr) {
    console.warn(`[RailwayProvision] Deploy trigger failed (non-fatal — Railway will auto-deploy):`, deployErr)
  }

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
