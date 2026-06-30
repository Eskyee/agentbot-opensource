/**
 * Railway-direct provisioning — creates OpenClaw agent containers via Railway GraphQL API.
 *
 * Uses the agentbot gateway wrapper image (gateway/ in repo) which includes:
 *   - Proper process management with auto-restart and exponential backoff
 *   - Health endpoint at /healthz for Railway auto-restart
 *   - HTTP proxy to OpenClaw gateway (no raw TCP proxy hack)
 *   - Persistent volume at /data for config/conversations
 *   - Config built from env vars — no inline start command
 *
 * Required env vars (set in Vercel project settings):
 *   RAILWAY_API_KEY         — Railway API token
 *   RAILWAY_PROJECT_ID      — Railway project ID
 *   RAILWAY_ENVIRONMENT_ID  — Railway environment ID
 */

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'
type RailwayTokenType = 'project' | 'workspace' | 'account' | 'oauth'

/**
 * Gateway wrapper image — built from gateway/ directory in the agentbot repo.
 * Includes OpenClaw + Express wrapper with health checks, auto-restart, volume support.
 * The wrapper manages the gateway process — no start command needed.
 */
const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:2026.4.29'

export interface TailscaleProvisionOptions {
  enabled?: boolean
  mode?: 'serve' | 'funnel' | 'tailnet'
  authKey?: string
  hostname?: string
  tags?: string[]
  acceptRoutes?: boolean
  password?: string
  resetOnExit?: boolean
}

type NormalizedTailscaleOptions = Required<Pick<TailscaleProvisionOptions, 'enabled' | 'mode' | 'authKey' | 'acceptRoutes'>> &
  Pick<TailscaleProvisionOptions, 'hostname' | 'tags' | 'password' | 'resetOnExit'>

function normalizeTailscaleOptions(options?: TailscaleProvisionOptions | null): NormalizedTailscaleOptions | null {
  if (!options?.enabled) return null
  const authKey = options.authKey?.trim()
  if (!authKey) {
    throw new Error('Tailscale auth key is required when Tailscale is enabled')
  }
  const mode = options.mode === 'funnel' || options.mode === 'tailnet' ? options.mode : 'serve'
  const password = options.password?.trim()
  if (mode === 'funnel' && !password) {
    throw new Error('Tailscale Funnel requires a gateway password')
  }

  return {
    enabled: true,
    mode,
    authKey,
    hostname: options.hostname?.trim() || undefined,
    tags: Array.isArray(options.tags)
      ? options.tags.map((tag) => tag.trim()).filter(Boolean)
      : undefined,
    acceptRoutes: options.acceptRoutes !== false,
    password,
    resetOnExit: options.resetOnExit === true,
  }
}

function buildGatewayTailscaleConfig(token: string, options?: TailscaleProvisionOptions | null) {
  const tailscale = normalizeTailscaleOptions(options)
  if (!tailscale) {
    return {
      bind: 'lan',
      auth: { mode: 'token', token },
    }
  }

  if (tailscale.mode === 'tailnet') {
    return {
      bind: 'tailnet',
      auth: { mode: 'token', token },
    }
  }

  return {
    bind: 'loopback',
    tailscale: {
      mode: tailscale.mode,
      resetOnExit: tailscale.resetOnExit,
    },
    auth: tailscale.mode === 'funnel'
      ? { mode: 'password' }
      : { mode: 'token', token, allowTailscale: true },
  }
}

function getTailscaleEnvVars(agentId: string, options?: TailscaleProvisionOptions | null): Record<string, string> {
  const tailscale = normalizeTailscaleOptions(options)
  if (!tailscale) return {}

  return {
    OPENCLAW_TAILSCALE_MODE: tailscale.mode,
    TAILSCALE_AUTHKEY: tailscale.authKey || '',
    TAILSCALE_HOSTNAME: tailscale.hostname || `agentbot-${agentId}`,
    TAILSCALE_TAGS: tailscale.tags?.join(',') || '',
    TAILSCALE_ACCEPT_ROUTES: String(tailscale.acceptRoutes !== false),
    TAILSCALE_STATE_DIR: '/data/tailscale',
    TAILSCALE_SOCKS5_SERVER: '127.0.0.1:1055',
    TAILSCALE_OUTBOUND_HTTP_PROXY_LISTEN: '127.0.0.1:1055',
    AGENTBOT_TAILSCALE_PROXY: 'socks5://127.0.0.1:1055',
    ...(tailscale.password ? { OPENCLAW_GATEWAY_PASSWORD: tailscale.password } : {}),
  }
}

function getRailwayTokenType(): RailwayTokenType {
  const raw = process.env.RAILWAY_TOKEN_TYPE?.trim().toLowerCase()
  if (raw === 'project' || raw === 'workspace' || raw === 'account' || raw === 'oauth') {
    return raw
  }
  return 'account'
}

function getRailwayAuthHeaders(key: string, tokenType = getRailwayTokenType()): Record<string, string> {
  return tokenType === 'project'
    ? {
        'Project-Access-Token': key,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
    : {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
}

function getRailwayAuthAttempts(): RailwayTokenType[] {
  const configured = getRailwayTokenType()
  if (configured === 'project') return ['project', 'account']
  if (configured === 'account') return ['account', 'project']
  return [configured]
}

function isRailwayUnauthorized(message: string) {
  return /not authorized|unauthorized|forbidden/i.test(message)
}

export function getAgentEnvVars(
  userId: string,
  plan: string,
  gatewayToken?: string,
  tailscaleOptions?: TailscaleProvisionOptions | null,
): Record<string, string> {
  const explicitOrigins = (process.env.OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const defaultOrigins = [
    'https://agentbot.sh',
    'https://www.agentbot.sh',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...explicitOrigins]))
  const token = gatewayToken || process.env.OPENCLAW_GATEWAY_TOKEN || ''
  const gatewayTailscaleConfig = buildGatewayTailscaleConfig(token, tailscaleOptions)
  const configJson = JSON.stringify({
    env: { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '' },
    gateway: {
      mode: 'local',
      ...gatewayTailscaleConfig,
      trustedProxies: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10', '172.16.0.0/12', '192.168.0.0/16'],
      controlUi: {
        allowedOrigins,
        // Auto-pair: token auth is sufficient. OpenClaw 2026.4+ requires this
        // to be true or every browser session is blocked with "device pairing required".
        dangerouslyDisableDeviceAuth: true,
        dangerouslyAllowHostHeaderOriginFallback: false,
      },
      http: { endpoints: { chatCompletions: { enabled: true } } },
    },
    agents: {
      defaults: {
        model: { primary: 'xiaomi/mimo-v2.5-pro' },
        heartbeat: { every: '30m', lightContext: true, isolatedSession: true },
      },
    },
    channels: {
      telegram: { enabled: false, dmPolicy: 'pairing' },
      discord: { enabled: false, dmPolicy: 'pairing' },
      whatsapp: { enabled: false, dmPolicy: 'pairing' },
    },
    mcp: {
      servers: {
        'robinhood-trading': {
          url: 'https://agent.robinhood.com/mcp/trading',
          transport: 'streamable-http',
          enabled: true,
        },
      },
    },
    cron: { enabled: true, maxConcurrentRuns: 2, sessionRetention: '24h' },
    update: {
      channel: 'stable',
      auto: {
        enabled: true,
        stableDelayHours: 6,
        stableJitterHours: 12,
        betaCheckIntervalHours: 1,
      },
    },
    session: {
      scope: 'per-sender',
      reset: { mode: 'daily', atHour: 4 },
      maintenance: { mode: 'warn', pruneAfter: '30d', maxEntries: 500 },
    },
    tools: {
      profile: 'coding',
      exec: { backgroundMs: 10000, timeoutSec: 1800 },
      web: { search: { enabled: true }, fetch: { enabled: true, maxChars: 50000 } },
    },
  })

  return {
    OPENCLAW_GATEWAY_TOKEN: token,
    WRAPPER_ADMIN_PASSWORD: token,
    OPENCLAW_GATEWAY_URL:   process.env.OPENCLAW_GATEWAY_URL   || '',
    OPENCLAW_GATEWAY_BIND:  'lan',
    OPENCLAW_CONFIG_JSON:   configJson,
    PORT:                   '18789',
    AGENTBOT_USER_ID:       userId,
    AGENTBOT_PLAN:          plan,
    AGENTBOT_API_URL:       process.env.BACKEND_API_URL        || '',
    DATABASE_URL:           process.env.DATABASE_URL           || '',
    OPENROUTER_API_KEY:     process.env.OPENROUTER_API_KEY     || '',
    INTERNAL_API_KEY:       process.env.INTERNAL_API_KEY       || '',
    WALLET_ENCRYPTION_KEY:  process.env.WALLET_ENCRYPTION_KEY  || '',
    NODE_ENV:               'production',
    ...getTailscaleEnvVars(userId, tailscaleOptions),
  }
}

async function railwayGql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const key = process.env.RAILWAY_API_KEY
  if (!key) throw new Error('RAILWAY_API_KEY not configured')

  let lastError: Error | null = null

  for (const tokenType of getRailwayAuthAttempts()) {
    const res = await fetch(RAILWAY_API, {
      method: 'POST',
      headers: getRailwayAuthHeaders(key, tokenType),
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const message = `Railway API ${res.status}: ${text}`
      lastError = new Error(message)
      if (isRailwayUnauthorized(message)) continue
      throw lastError
    }

    const json = await res.json() as { data?: T; errors?: { message: string }[] }
    if (json.errors?.length) {
      const message = `Railway GQL: ${json.errors.map(e => e.message).join(', ')}`
      lastError = new Error(message)
      if (isRailwayUnauthorized(message)) continue
      throw lastError
    }

    return json.data as T
  }

  throw lastError || new Error('Railway API authorization failed')
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
  plan: string = 'solo',
  gatewayToken?: string,
  tailscaleOptions?: TailscaleProvisionOptions | null,
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

  // 1b. Set resource limits + health check (no start command — image has CMD)
  const planLimits: Record<string, { memoryLimitMb: number; cpuLimit: number }> = {
    autonomous: { memoryLimitMb: 2048,  cpuLimit: 1 },
    solo:        { memoryLimitMb: 2048,  cpuLimit: 1 },
    collective:  { memoryLimitMb: 4096,  cpuLimit: 2 },
    label:       { memoryLimitMb: 8192,  cpuLimit: 4 },
    network:     { memoryLimitMb: 16384, cpuLimit: 4 },
  }
  const limits = planLimits[plan] ?? planLimits.solo
  await railwayGql(`
    mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }
  `, {
    serviceId,
    environmentId,
    input: {
      memoryLimitMb: limits.memoryLimitMb,
      cpuLimit: limits.cpuLimit,
      healthcheckPath: '/healthz',
      healthcheckTimeout: 60,
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
    },
  })
  console.log(`[RailwayProvision] Resource limits + health check set for ${serviceId}`)

  // 1c. Add persistent volume for config/conversations
  try {
    await railwayGql(`
      mutation VolumeCreate($input: VolumeCreateInput!) {
        volumeCreate(input: $input) { id }
      }
    `, {
      input: {
        projectId,
        environmentId,
        serviceId,
        mountPath: '/data',
      },
    })
    console.log(`[RailwayProvision] Volume mounted at /data for ${serviceId}`)
  } catch (volErr) {
    console.warn(`[RailwayProvision] Volume creation failed (non-fatal):`, volErr)
  }

  // 2. Inject env vars
  const variables = getAgentEnvVars(agentId, plan, gatewayToken, tailscaleOptions)
  await railwayGql(`
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: { projectId, environmentId, serviceId, variables },
  })

  // 3. Generate public domain (must happen before deploy)
  let url = `https://${serviceName}YOUR_SERVICE_URL`
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
