import crypto from 'crypto';
import { DEFAULT_OPENCLAW_IMAGE } from './openclaw-version';

/**
 * Agentbot Container Manager — Railway API Edition
 *
 * Provisions OpenClaw agents as Railway services (Docker image).
 * Each agent = a new Railway service running ghcr.io/openclaw/openclaw.
 *
 * Requires env vars:
 *   RAILWAY_API_KEY       — Railway API token (from railway.app/account/tokens)
 *   RAILWAY_PROJECT_ID    — Railway project ID
 *   RAILWAY_ENVIRONMENT_ID — Railway environment ID (usually "production")
 */

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';
const OPENCLAW_IMAGE = DEFAULT_OPENCLAW_IMAGE;
const OPENCLAW_HOME_DIR = '/root/.openclaw';
const OPENCLAW_WORKSPACE_DIR = `${OPENCLAW_HOME_DIR}/workspace`;
const OPENCLAW_CONFIG_PATH = `${OPENCLAW_HOME_DIR}/openclaw.json`;
const CONTROL_UI_ALLOWED_ORIGINS = [
  process.env.CONTROL_UI_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.sh',
  process.env.CONTROL_UI_COMPAT_ORIGIN,
].filter(Boolean);

export interface TailscaleProvisionOptions {
  enabled?: boolean;
  mode?: 'serve' | 'funnel' | 'tailnet';
  authKey?: string;
  hostname?: string;
  tags?: string[];
  acceptRoutes?: boolean;
  password?: string;
  resetOnExit?: boolean;
}

type NormalizedTailscaleOptions = Required<Pick<TailscaleProvisionOptions, 'enabled' | 'mode' | 'authKey' | 'acceptRoutes'>> &
  Pick<TailscaleProvisionOptions, 'hostname' | 'tags' | 'password' | 'resetOnExit'>;

function normalizeTailscaleOptions(options?: TailscaleProvisionOptions | null): NormalizedTailscaleOptions | null {
  if (!options?.enabled) return null;
  const authKey = options.authKey?.trim();
  if (!authKey) {
    throw new Error('Tailscale auth key is required when Tailscale is enabled');
  }
  const mode = options.mode === 'funnel' || options.mode === 'tailnet' ? options.mode : 'serve';
  const password = options.password?.trim();
  if (mode === 'funnel' && !password) {
    throw new Error('Tailscale Funnel requires a gateway password');
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
  };
}

function buildGatewayTailscaleConfig(gatewayToken: string, options?: TailscaleProvisionOptions | null) {
  const tailscale = normalizeTailscaleOptions(options);
  if (!tailscale) {
    return {
      bind: 'lan',
      auth: { mode: 'token', token: gatewayToken },
    };
  }

  if (tailscale.mode === 'tailnet') {
    return {
      bind: 'tailnet',
      auth: { mode: 'token', token: gatewayToken },
    };
  }

  return {
    bind: 'loopback',
    tailscale: {
      mode: tailscale.mode,
      resetOnExit: tailscale.resetOnExit,
    },
    auth: tailscale.mode === 'funnel'
      ? { mode: 'password' }
      : { mode: 'token', token: gatewayToken, allowTailscale: true },
  };
}

function getTailscaleEnvVars(agentId: string, options?: TailscaleProvisionOptions | null): Record<string, string> {
  const tailscale = normalizeTailscaleOptions(options);
  if (!tailscale) return {};

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
  };
}

// Plan → CPU (millicores) + Memory (MB)
const PLAN_RESOURCES: Record<string, { cpuMillicores: number; memoryMB: number }> = {
  solo:       { cpuMillicores: 1000, memoryMB: 2048 },
  collective: { cpuMillicores: 2000, memoryMB: 4096 },
  label:      { cpuMillicores: 4000, memoryMB: 8192 },
  network:    { cpuMillicores: 4000, memoryMB: 16384 },
};

// Env vars to inject into each agent container
function getAgentEnvVars(
  userId: string,
  plan: string,
  agentId?: string,
  tailscaleOptions?: TailscaleProvisionOptions | null
): Record<string, string> {
  return {
    OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN || '',
    OPENCLAW_GATEWAY_URL:   process.env.OPENCLAW_GATEWAY_URL   || '',
    // Gateway listens on 18789 by default — Railway HTTP proxy must route here
    OPENCLAW_GATEWAY_PORT:  '18789',
    AGENTBOT_USER_ID:       userId,
    AGENTBOT_PLAN:          plan,
    AGENTBOT_AGENT_ID:      agentId || userId,
    AGENTBOT_API_URL:       process.env.BACKEND_API_URL        || '',
    DATABASE_URL:           process.env.DATABASE_URL           || '',
    OPENROUTER_API_KEY:     process.env.OPENROUTER_API_KEY     || '',
    INTERNAL_API_KEY:       process.env.INTERNAL_API_KEY       || '',
    WALLET_ENCRYPTION_KEY:  process.env.WALLET_ENCRYPTION_KEY  || '',
    NODE_ENV:               'production',
    // Railway HTTP proxy port — must match OPENCLAW_GATEWAY_PORT
    PORT:                   '18789',
    // Permission hooks — tiered command classification
    AGENTBOT_HOOK_ENABLED:  'true',
    AGENTBOT_PERMISSION_MODE: plan === 'solo' ? 'permissive' : 'strict',
    ...getTailscaleEnvVars(agentId || userId, tailscaleOptions),
  };
}

export interface ContainerResult {
  container: string;
  status: string;
  port?: number;
  startedAt?: string;
  serviceId?: string;
  url?: string;
  /** Auto-connect Control UI URL with token embedded in fragment (never sent to server) */
  controlUiUrl?: string;
}

export type PlanType = 'solo' | 'collective' | 'label' | 'network';

// ---------------------------------------------------------------------------
// Railway GraphQL helper
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.RAILWAY_API_KEY;
  if (!key) throw new Error('RAILWAY_API_KEY not configured');
  return key;
}

function getRailwayTokenType(): 'project' | 'workspace' | 'account' | 'oauth' {
  const raw = (process.env.RAILWAY_TOKEN_TYPE || 'account').trim().toLowerCase();
  if (raw === 'project' || raw === 'workspace' || raw === 'account' || raw === 'oauth') {
    return raw;
  }
  return 'account';
}

async function railwayGql<T = any>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const key = getApiKey();
  const headers = getRailwayTokenType() === 'project'
    ? {
        'Project-Access-Token': key,
        'Content-Type': 'application/json',
      }
    : {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      };

  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Railway API ${res.status}: ${text}`);
  }

  const json = await res.json() as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`Railway GQL error: ${json.errors.map(e => e.message).join(', ')}`);
  }
  return json.data as T;
}

// ---------------------------------------------------------------------------
// Public API (same interface as the old Render edition)
// ---------------------------------------------------------------------------

/**
 * Check if Railway API is reachable (non-throwing).
 * Kept as isDockerReady() for backward compat with callers.
 */
export async function isDockerReady(): Promise<boolean> {
  try {
    await railwayGql('{ me { id } }');
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a new OpenClaw agent service on Railway.
 *
 * Reliability semantics:
 *
 *   • IDEMPOTENT — if a service named `agentbot-agent-${userId}` already
 *     exists, we return its current handle instead of creating a second one.
 *     The previous behaviour was to fail with `Unique constraint` partway
 *     through, which left the user permanently unable to reprovision because
 *     the orphan service still owned the name slot.
 *
 *   • COMPENSATING — if any of the post-create steps (env vars, start
 *     command, domain, deploy) throws, we issue a `serviceDelete` so the
 *     half-built service is cleaned up before the error propagates. Without
 *     this, every retry hits the idempotency branch above and returns a
 *     handle to a broken service.
 *
 *   • Compensation failures are logged but never rethrown — the user-facing
 *     error is the original provisioning failure, not the cleanup failure.
 */
export async function createContainer(
  userId: string,
  plan: PlanType = 'solo',
  tailscaleOptions?: TailscaleProvisionOptions | null
): Promise<ContainerResult> {
  const projectId     = process.env.RAILWAY_PROJECT_ID;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
  if (!projectId)     throw new Error('RAILWAY_PROJECT_ID not configured');
  if (!environmentId) throw new Error('RAILWAY_ENVIRONMENT_ID not configured');

  const serviceName = `agentbot-agent-${userId}`;

  // Idempotency: if a service with this name already exists, return its
  // handle instead of creating a duplicate. Callers that want a clean slate
  // should call destroyContainer first.
  //
  // We query Railway for the service's actual assigned domain so the URL
  // returned to the caller is the one Railway is serving, not a guess based
  // on naming convention. We omit `controlUiUrl` here intentionally — the
  // gateway token is generated fresh per createContainer call and we cannot
  // recover the existing token from Railway, so emitting a "control UI URL"
  // without a valid token would be misleading.
  const existingId = await getServiceIdByName(serviceName).catch(() => null);
  if (existingId) {
    const existingDomain = await getServiceDomain(existingId).catch(() => null);
    const existingUrl = existingDomain
      ? `https://${existingDomain}`
      : `https://${serviceName}YOUR_SERVICE_URL`;
    console.log(`[ContainerManager/Railway] Reusing existing service ${existingId} (${serviceName}) for ${userId} → ${existingUrl}`);
    return {
      container: serviceName,
      status: 'deploying',
      serviceId: existingId,
      url: existingUrl,
      startedAt: new Date().toISOString(),
    };
  }

  // 1. Create the service
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
  });

  const serviceId = created.serviceCreate.id;
  console.log(`[ContainerManager/Railway] Created service ${serviceId} (${serviceName}) for ${userId}`);

  // Compensation helper — delete the half-built service so a retry can
  // start clean rather than colliding on the unique service name.
  const compensate = async (failedStep: string, err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ContainerManager/Railway] ${failedStep} failed for ${serviceName}: ${message}; rolling back service ${serviceId}`);
    try {
      await railwayGql(`
        mutation ServiceDelete($id: String!) {
          serviceDelete(id: $id)
        }
      `, { id: serviceId });
      console.log(`[ContainerManager/Railway] Compensated: deleted ${serviceId}`);
    } catch (cleanupErr: unknown) {
      const cleanupMessage = cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr);
      console.error(`[ContainerManager/Railway] Compensation failed for ${serviceId}: ${cleanupMessage}`);
    }
  };

  // 2. Build openclaw.json config and inject all env vars in one shot.
  //    Config is passed as OPENCLAW_CONFIG_JSON env var so the start command
  //    can write it without shell heredoc quoting issues.
  // Generate a unique token for each agent - don't use shared platform token
  const gatewayToken = crypto.randomBytes(32).toString('hex')
  const gatewayTailscaleConfig = buildGatewayTailscaleConfig(gatewayToken, tailscaleOptions)
  const openclawConfig = {
    env: { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '' },
    gateway: {
      mode: 'local',
      ...gatewayTailscaleConfig,
      trustedProxies: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10', '172.16.0.0/12', '192.168.0.0/16'],
      controlUi: {
        allowedOrigins: CONTROL_UI_ALLOWED_ORIGINS,
        // Auto-pair: token auth is sufficient. OpenClaw 2026.4+ requires this
        // to be true or every browser session is blocked with "device pairing required".
        dangerouslyDisableDeviceAuth: true,
        dangerouslyAllowHostHeaderOriginFallback: false,
      },
      http: { endpoints: { chatCompletions: { enabled: true } } },
    },
    agents: {
      defaults: {
        workspace: OPENCLAW_WORKSPACE_DIR,
        model: { primary: 'openrouter/xiaomi/mimo-v2-pro' },
        heartbeat: { every: '30m', lightContext: true, isolatedSession: true },
      },
    },
    channels: {
      telegram: { enabled: false, dmPolicy: 'pairing' },
      discord:  { enabled: false, dmPolicy: 'pairing' },
      whatsapp: { enabled: false, dmPolicy: 'pairing' },
      webchat:  { enabled: true },
    },
    cron:    { enabled: true, maxConcurrentRuns: 2, sessionRetention: '24h' },
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
      web:  { search: { enabled: true }, fetch: { enabled: true, maxChars: 50000 } },
    },
  };

  const variables = {
    ...getAgentEnvVars(userId, plan, userId, tailscaleOptions),
    OPENCLAW_CONFIG_JSON: JSON.stringify(openclawConfig),
  };

  try {
    await railwayGql(`
      mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `, {
      input: { projectId, environmentId, serviceId, variables },
    });
  } catch (err) {
    await compensate('variableCollectionUpsert', err);
    throw err;
  }

  // 3. Set start command — reads config from env var (no heredoc quoting issues).
  //    Single-quoted sh -c body is safe because no single quotes appear inside it.
  const startCmd = `sh -c 'if [ -n "$TAILSCALE_AUTHKEY$TS_AUTHKEY" ]; then if command -v agentbot-tailscale-start >/dev/null 2>&1; then agentbot-tailscale-start; else echo "TAILSCALE_AUTHKEY set but this runtime image does not include Tailscale support" >&2; exit 1; fi; fi; mkdir -p ${OPENCLAW_HOME_DIR} && printf "%s" "$OPENCLAW_CONFIG_JSON" > ${OPENCLAW_CONFIG_PATH} && (openclaw doctor || true); if [ -n "$OPENCLAW_TAILSCALE_MODE" ] && [ "$OPENCLAW_TAILSCALE_MODE" != "tailnet" ]; then exec openclaw gateway --tailscale "$OPENCLAW_TAILSCALE_MODE"; fi; exec openclaw gateway'`;

  const planResources = PLAN_RESOURCES[plan] ?? PLAN_RESOURCES.solo;

  try {
    // serviceId and environmentId are top-level mutation arguments, not inside input.
    await railwayGql(`
      mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
        serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
      }
    `, {
      serviceId,
      environmentId,
      input: {
        startCommand: startCmd,
        memoryLimitMb: planResources.memoryMB,
        cpuLimit: planResources.cpuMillicores / 1000,
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10,
      },
    });
  } catch (err) {
    await compensate('serviceInstanceUpdate', err);
    throw err;
  }
  console.log(`[ContainerManager/Railway] Set startCommand + resources for ${serviceName}`);

  // 4. Create service domain with targetPort 18789 (routes Railway HTTP proxy to Gateway)
  //    Without this, Railway's proxy defaults to port 3000 and the Gateway is unreachable.
  let domainRes: { serviceDomainCreate?: { domain?: string; targetPort?: number } } | undefined;
  try {
    domainRes = await railwayGql<{ serviceDomainCreate: { id: string; domain: string; targetPort: number } }>(`
      mutation ServiceDomainCreate($input: ServiceDomainCreateInput!) {
        serviceDomainCreate(input: $input) {
          id
          domain
          targetPort
        }
      }
    `, {
      input: {
        serviceId,
        environmentId,
        targetPort: 18789,
      },
    });
  } catch (err) {
    await compensate('serviceDomainCreate', err);
    throw err;
  }
  const serviceDomain = domainRes?.serviceDomainCreate;
  console.log(`[ContainerManager/Railway] Created domain: ${serviceDomain?.domain} → port ${serviceDomain?.targetPort}`);

  // 5. Deploy
  try {
    await railwayGql(`
      mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `, { serviceId, environmentId });
  } catch (err) {
    await compensate('serviceInstanceDeploy', err);
    throw err;
  }

  // Use the Railway-provided domain (with targetPort: 18789)
  const serviceUrl = serviceDomain?.domain
    ? `https://${serviceDomain.domain}`
    : `https://${serviceName}YOUR_SERVICE_URL`;

  const controlUiBase = (
    process.env.OPENCLAW_CONTROL_UI_URL ||
    process.env.OPENCLAW_GATEWAY_URL ||
    'https://YOUR_SERVICE_URL'
  )
    .replace(/\/(chat|skills|config)\/?$/, '')
    .replace(/\/$/, '');
  const controlSession = process.env.OPENCLAW_CONTROL_UI_SESSION || 'agent:main:main';
  const gatewayUrl = `wss://${serviceDomain?.domain || `${serviceName}YOUR_SERVICE_URL`}`;

  const controlUiUrl = gatewayToken
    ? `${controlUiBase}/chat?session=${encodeURIComponent(controlSession)}#token=${encodeURIComponent(gatewayToken)}&gatewayUrl=${encodeURIComponent(gatewayUrl)}`
    : `${controlUiBase}/chat?session=${encodeURIComponent(controlSession)}`;

  return {
    container: serviceName,
    status: 'deploying',
    serviceId,
    url: serviceUrl,
    controlUiUrl,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Restart a service (redeploy latest).
 */
export async function startContainer(userId: string): Promise<ContainerResult> {
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
  if (!environmentId) throw new Error('RAILWAY_ENVIRONMENT_ID not configured');

  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  if (!serviceId) throw new Error(`No Railway service found for user ${userId}`);

  await railwayGql(`
    mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `, { serviceId, environmentId });

  return { container: `agentbot-agent-${userId}`, status: 'running', serviceId };
}

/**
 * Railway has no built-in "suspend". This is a no-op — return stopped status.
 * To actually stop usage, delete the service instead.
 */
export async function pauseContainer(userId: string): Promise<ContainerResult> {
  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  return { container: `agentbot-agent-${userId}`, status: 'suspended', serviceId: serviceId || undefined };
}

/**
 * Delete a Railway service.
 */
export async function destroyContainer(
  userId: string,
  _backup: boolean = true
): Promise<ContainerResult> {
  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  if (!serviceId) return { container: `agentbot-agent-${userId}`, status: 'destroyed' };

  await railwayGql(`
    mutation ServiceDelete($id: String!) {
      serviceDelete(id: $id)
    }
  `, { id: serviceId });

  return { container: `agentbot-agent-${userId}`, status: 'destroyed' };
}

/**
 * Get the status of a user's service.
 */
export async function getContainerStatus(userId: string): Promise<ContainerResult> {
  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  if (!serviceId) return { container: `agentbot-agent-${userId}`, status: 'not_found' };

  try {
    const data = await railwayGql<{
      service: {
        id: string;
        name: string;
        serviceInstances: {
          edges: Array<{
            node: {
              latestDeployment: { id: string; status: string; url?: string } | null;
            };
          }>;
        };
      };
    }>(`
      query ServiceById($id: String!) {
        service(id: $id) {
          id name
          serviceInstances {
            edges {
              node {
                latestDeployment { id status url createdAt }
                deployments(first: 20) {
                  edges {
                    node { id status createdAt }
                  }
                }
              }
            }
          }
        }
      }
    `, { id: serviceId });

    const instance  = data.service.serviceInstances.edges[0]?.node;
    const deployment = instance?.latestDeployment;
    const deployStatus = deployment?.status?.toLowerCase() || 'unknown';

    // Railway deployment statuses: DEPLOYING, SUCCESS, FAILED, CRASHED, SLEEPING
    let status = 'unknown';
    if (deployStatus === 'success')               status = 'running';
    else if (deployStatus === 'failed' || deployStatus === 'crashed') status = 'error';
    else if (deployStatus === 'deploying')         status = 'deploying';
    else if (deployStatus === 'sleeping')          status = 'suspended';
    else                                           status = deployStatus;

    // Calculate restart count and last exit from deployment history
    const allDeployments = instance?.deployments?.edges?.map((e: { node: { id: string; status: string; createdAt: string } }) => e.node) || [];
    const restartCount = allDeployments.filter((d: { status: string }) => d.status === 'CRASHED' || d.status === 'FAILED').length;
    const lastCrash = allDeployments.find((d: { status: string }) => d.status === 'CRASHED' || d.status === 'FAILED');
    const lastExitCode = lastCrash ? (lastCrash.status === 'CRASHED' ? 137 : 1) : null;
    const lastExitAt = lastCrash?.createdAt || null;

    return {
      container: data.service.name,
      status,
      serviceId,
      url: deployment?.url,
      restartCount,
      lastExitCode,
      lastExitAt,
      lastDeployAt: deployment?.createdAt || null,
    };
  } catch {
    return { container: `agentbot-agent-${userId}`, status: 'error', serviceId };
  }
}

/**
 * List all agentbot agent services in the project.
 */
export async function listContainers(): Promise<string> {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  if (!projectId) throw new Error('RAILWAY_PROJECT_ID not configured');

  const data = await railwayGql<{
    project: {
      services: {
        edges: Array<{ node: { id: string; name: string } }>;
      };
    };
  }>(`
    query ProjectServices($projectId: String!) {
      project(id: $projectId) {
        services { edges { node { id name } } }
      }
    }
  `, { projectId });

  const agents = data.project.services.edges
    .map(e => e.node)
    .filter(s => s.name.startsWith('agentbot-agent-'));

  return JSON.stringify(agents, null, 2);
}

/**
 * Build image — no-op on Railway (auto-built from Docker image tag).
 */
export async function buildImage(): Promise<string> {
  return 'Railway auto-pulls from the Docker image. No manual build needed.';
}

/**
 * Health check for a user's agent.
 */
export async function checkHealth(userId: string): Promise<boolean> {
  try {
    const s = await getContainerStatus(userId);
    if (s.status !== 'running' || !s.url) return false;
    const res = await fetch(`${s.url}/healthz`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Resume on activity — redeploy if not running.
 */
export async function resumeOnActivity(userId: string): Promise<ContainerResult> {
  const s = await getContainerStatus(userId);
  if (s.status !== 'running') return startContainer(userId);
  return s;
}

/**
 * Idle auto-pause timers (Railway doesn't suspend, so we just track idle time).
 */
const idleTimers: Map<string, NodeJS.Timeout> = new Map();

export function resetIdleTimer(userId: string, idleMinutes: number = 30): void {
  const existing = idleTimers.get(userId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    try {
      await pauseContainer(userId);
      console.log(`[ContainerManager/Railway] Idle agent paused for ${userId}`);
    } catch (err: any) {
      console.error(`[ContainerManager/Railway] Failed to pause ${userId}:`, err.message);
    }
    idleTimers.delete(userId);
  }, idleMinutes * 60 * 1000);

  idleTimers.set(userId, timer);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getServiceIdByName(name: string): Promise<string | null> {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  if (!projectId) return null;

  try {
    const data = await railwayGql<{
      project: { services: { edges: Array<{ node: { id: string; name: string } }> } };
    }>(`
      query ProjectServices($projectId: String!) {
        project(id: $projectId) {
          services { edges { node { id name } } }
        }
      }
    `, { projectId });

    const match = data.project.services.edges.find(e => e.node.name === name);
    return match?.node.id || null;
  } catch {
    return null;
  }
}

/**
 * Look up the Railway-assigned domain for an existing service.
 *
 * Returns the first service domain the platform has provisioned (without
 * the protocol prefix), or null if the service has no domain yet (e.g. the
 * domain creation step previously failed and was never retried). Callers
 * should fall back to the naming-convention guess only when this returns
 * null.
 */
async function getServiceDomain(serviceId: string): Promise<string | null> {
  try {
    const data = await railwayGql<{
      service: {
        serviceInstances: {
          edges: Array<{
            node: {
              domains: {
                serviceDomains: Array<{ domain: string }>;
              };
            };
          }>;
        };
      };
    }>(`
      query ServiceDomain($id: String!) {
        service(id: $id) {
          serviceInstances {
            edges {
              node {
                domains { serviceDomains { domain } }
              }
            }
          }
        }
      }
    `, { id: serviceId });

    for (const edge of data.service.serviceInstances.edges) {
      const domains = edge.node.domains?.serviceDomains ?? [];
      if (domains.length > 0 && domains[0].domain) {
        return domains[0].domain;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  createContainer,
  startContainer,
  pauseContainer,
  destroyContainer,
  getContainerStatus,
  listContainers,
  buildImage,
  checkHealth,
  resumeOnActivity,
  resetIdleTimer,
  isDockerReady,
};
