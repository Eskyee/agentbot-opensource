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
const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:2026.4.2'

const OPENCLAW_START_CMD =
  `node -e "const{spawn}=require('child_process');const fs=require('fs');fs.writeFileSync('/tmp/openclaw.json',JSON.stringify({env:{OPENROUTER_API_KEY:process.env.OPENROUTER_API_KEY},gateway:{mode:'local',bind:'loopback',trustedProxies:['127.0.0.1'],controlUi:{allowedOrigins:['*'],dangerouslyDisableDeviceAuth:true}},agents:{defaults:{workspace:'/home/node/.openclaw/workspace',model:{primary:'openrouter/xiaomi/mimo-v2-pro'},heartbeat:{every:'30m',lightContext:true,isolatedSession:true}}},channels:{telegram:{enabled:false,dmPolicy:'pairing'},discord:{enabled:false,dmPolicy:'pairing'},whatsapp:{enabled:false,dmPolicy:'pairing'},webchat:{enabled:true}},cron:{enabled:true,maxConcurrentRuns:2,sessionRetention:'24h'},session:{scope:'per-sender',reset:{mode:'daily',atHour:4},maintenance:{mode:'warn',pruneAfter:'30d',maxEntries:500}},tools:{profile:'coding',exec:{backgroundMs:10000,timeoutSec:1800},web:{search:{enabled:true},fetch:{enabled:true,maxChars:50000}}}}));const p=spawn('openclaw',['gateway'],{stdio:'inherit',env:{...process.env,OPENCLAW_CONFIG_PATH:'/tmp/openclaw.json'}});p.on('error',e=>console.error('openclaw err:',e));setTimeout(()=>{require('net').createServer(s=>{const c=require('net').connect(18789,'127.0.0.1',()=>{s.pipe(c);c.pipe(s)});c.on('error',()=>s.destroy())}).listen(parseInt(process.env.PORT)||8080,'0.0.0.0',()=>console.log('tcp proxy on port',process.env.PORT||8080))},3000)"`

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

async function provisionOnRailway(agentId: string, plan: string = 'solo') {
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

  // 2. Set start command + plan resource limits
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.solo
  await railwayGql(`
    mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }
  `, {
    serviceId, environmentId,
    input: {
      startCommand: OPENCLAW_START_CMD,
      memoryLimitMb: limits.memoryLimitMb,
      cpuLimit: limits.cpuLimit,
    },
  })

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
