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

// Plan → CPU (millicores) + Memory (MB)
const PLAN_RESOURCES: Record<string, { cpuMillicores: number; memoryMB: number }> = {
  solo:       { cpuMillicores: 1000, memoryMB: 2048 },
  collective: { cpuMillicores: 2000, memoryMB: 4096 },
  label:      { cpuMillicores: 4000, memoryMB: 8192 },
  network:    { cpuMillicores: 4000, memoryMB: 16384 },
};

// Env vars to inject into each agent container
function getAgentEnvVars(userId: string, plan: string, agentId?: string): Record<string, string> {
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

async function railwayGql<T = any>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
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
 */
export async function createContainer(
  userId: string,
  plan: PlanType = 'solo'
): Promise<ContainerResult> {
  const projectId     = process.env.RAILWAY_PROJECT_ID;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
  if (!projectId)     throw new Error('RAILWAY_PROJECT_ID not configured');
  if (!environmentId) throw new Error('RAILWAY_ENVIRONMENT_ID not configured');

  const serviceName = `agentbot-agent-${userId}`;

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

  // 2. Build openclaw.json config and inject all env vars in one shot.
  //    Config is passed as OPENCLAW_CONFIG_JSON env var so the start command
  //    can write it without shell heredoc quoting issues.
  // Generate a unique token for each agent - don't use shared platform token
  const gatewayToken = crypto.randomBytes(32).toString('hex')
  const openclawConfig = {
    env: { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '' },
    gateway: {
      mode: 'local',
      bind: 'lan',
      auth: { mode: 'token', token: gatewayToken },
      trustedProxies: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10', '172.16.0.0/12', '192.168.0.0/16'],
      controlUi: {
        allowedOrigins: ['*'],
        dangerouslyDisableDeviceAuth: true,
        dangerouslyAllowHostHeaderOriginFallback: true,
      },
      http: { endpoints: { chatCompletions: { enabled: true } } },
    },
    agents: {
      defaults: {
        workspace: '/home/node/.openclaw/workspace',
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
    ...getAgentEnvVars(userId, plan),
    OPENCLAW_CONFIG_JSON: JSON.stringify(openclawConfig),
  };

  await railwayGql(`
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
  `, {
    input: { projectId, environmentId, serviceId, variables },
  });

  // 3. Set start command — reads config from env var (no heredoc quoting issues).
  //    Single-quoted sh -c body is safe because no single quotes appear inside it.
  const startCmd = `sh -c 'mkdir -p /home/node/.openclaw && printf "%s" "$OPENCLAW_CONFIG_JSON" > /home/node/.openclaw/openclaw.json && exec openclaw gateway'`;

  const planResources = PLAN_RESOURCES[plan] ?? PLAN_RESOURCES.solo;

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
  console.log(`[ContainerManager/Railway] Set startCommand + resources for ${serviceName}`);

  // 4. Create service domain with targetPort 18789 (routes Railway HTTP proxy to Gateway)
  //    Without this, Railway's proxy defaults to port 3000 and the Gateway is unreachable.
  const domainRes = await railwayGql(`
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
  const serviceDomain = domainRes?.serviceDomainCreate;
  console.log(`[ContainerManager/Railway] Created domain: ${serviceDomain?.domain} → port ${serviceDomain?.targetPort}`);

  // 5. Deploy
  await railwayGql(`
    mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `, { serviceId, environmentId });

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
                latestDeployment { id status url }
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

    return {
      container: data.service.name,
      status,
      serviceId,
      url: deployment?.url,
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
