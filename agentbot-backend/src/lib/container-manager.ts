/**
 * Agentbot Container Manager — Render API Edition
 *
 * Instead of local Docker, provisions agents as Render services.
 * Each agent = a new Render web service running ghcr.io/openclaw/openclaw.
 *
 * Requires: RENDER_API_KEY env var (from https://dashboard.render.com/account/api-tokens)
 */

const RENDER_API = 'https://api.render.com/v1';

// Plan → Render instance type
const PLAN_TO_INSTANCE: Record<string, string> = {
  solo: 'starter',
  collective: 'standard',
  label: 'pro',
  network: 'pro_plus',
};

// Env vars to inject into each agent container
function getAgentEnvVars(userId: string, plan: string): Record<string, string> {
  return {
    OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN || '',
    OPENCLAW_GATEWAY_URL: process.env.OPENCLAW_GATEWAY_URL || '',
    AGENTBOT_USER_ID: userId,
    AGENTBOT_PLAN: plan,
    AGENTBOT_API_URL: process.env.BACKEND_API_URL || 'https://agentbot-api.onrender.com',
    DATABASE_URL: process.env.DATABASE_URL || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || '',
    WALLET_ENCRYPTION_KEY: process.env.WALLET_ENCRYPTION_KEY || '',
  };
}

export interface ContainerResult {
  container: string;
  status: string;
  port?: number;
  startedAt?: string;
  serviceId?: string;
  url?: string;
}

export type PlanType = 'solo' | 'collective' | 'label' | 'network';

/**
 * Get Render API headers
 */
function getHeaders(): Record<string, string> {
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) throw new Error('RENDER_API_KEY not configured');
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Check if Render API is available (non-throwing).
 */
export async function isDockerReady(): Promise<boolean> {
  // Kept for backward compat — "Docker ready" now means "Render API ready"
  try {
    const res = await fetch(`${RENDER_API}/services?limit=1`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Create a new agent service on Render (Docker-backed)
 */
export async function createContainer(
  userId: string,
  plan: PlanType = 'solo'
): Promise<ContainerResult> {
  const ownerId = process.env.RENDER_OWNER_ID;
  const envId = process.env.RENDER_ENV_ID || 'evm-d6vh19h5pdvs738le6bg';

  if (!ownerId) throw new Error('RENDER_OWNER_ID not configured');

  const envVars = [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '3001' },
    ...Object.entries(getAgentEnvVars(userId, plan)).map(([key, value]) => ({
      key,
      value,
    })),
  ];

  const body = {
    type: 'web_service',
    name: `agentbot-agent-${userId}`,
    ownerId,
    repo: 'https://github.com/Eskyee/agentbot',
    branch: 'main',
    rootDir: 'agentbot-backend',
    autoDeploy: 'no',
    serviceDetails: {
      env: 'docker',
      envSpecificDetails: {
        dockerfilePath: 'Dockerfile',
        dockerContext: '.',
      },
      plan: PLAN_TO_INSTANCE[plan] || 'starter',
      region: 'oregon',
      numInstances: 1,
    },
    envVars,
  };

  const requestBody = JSON.stringify(body);

  const res = await fetch(`${RENDER_API}/services`, {
    method: 'POST',
    headers: getHeaders(),
    body: requestBody,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[ContainerManager/Render] Failed to create service for ${userId}: ${res.status} — ${err}`);
    throw new Error(`Render API error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  const service = data.service;

  console.log(`[ContainerManager/Render] Created service ${service.id} for ${userId}`);

  return {
    container: service.name,
    status: service.suspended === 'not_suspended' ? 'running' : 'stopped',
    serviceId: service.id,
    url: `https://${service.name}.onrender.com`,
    startedAt: service.createdAt,
  };
}

/**
 * Start a suspended service
 */
export async function startContainer(userId: string): Promise<ContainerResult> {
  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  if (!serviceId) throw new Error(`No service found for user ${userId}`);

  const res = await fetch(`${RENDER_API}/services/${serviceId}/resume`, {
    method: 'POST',
    headers: getHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Render resume error ${res.status}: ${err}`);
  }

  return { container: `agentbot-agent-${userId}`, status: 'running', serviceId };
}

/**
 * Suspend a service (saves money, keeps data)
 */
export async function pauseContainer(userId: string): Promise<ContainerResult> {
  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  if (!serviceId) throw new Error(`No service found for user ${userId}`);

  const res = await fetch(`${RENDER_API}/services/${serviceId}/suspend`, {
    method: 'POST',
    headers: getHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Render suspend error ${res.status}: ${err}`);
  }

  return { container: `agentbot-agent-${userId}`, status: 'suspended', serviceId };
}

/**
 * Delete a service
 */
export async function destroyContainer(
  userId: string,
  _backup: boolean = true
): Promise<ContainerResult> {
  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  if (!serviceId) throw new Error(`No service found for user ${userId}`);

  const res = await fetch(`${RENDER_API}/services/${serviceId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Render delete error ${res.status}: ${err}`);
  }

  return { container: `agentbot-agent-${userId}`, status: 'destroyed' };
}

/**
 * Get service status
 */
export async function getContainerStatus(userId: string): Promise<ContainerResult> {
  const serviceId = await getServiceIdByName(`agentbot-agent-${userId}`);
  if (!serviceId) return { container: `agentbot-agent-${userId}`, status: 'not_found' };

  const res = await fetch(`${RENDER_API}/services/${serviceId}`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return { container: `agentbot-agent-${userId}`, status: 'error', serviceId };
  }

  const data = await res.json() as any;
  const service = data.service || data;

  let status = 'unknown';
  if (service.suspended === 'suspended') status = 'suspended';
  else if (service.serviceDetails?.buildStatus === 'build_failed') status = 'error';
  else status = 'running';

  return {
    container: service.name,
    status,
    serviceId: service.id,
    url: service.serviceDetails?.url,
  };
}

/**
 * List all agent services
 */
export async function listContainers(): Promise<string> {
  const res = await fetch(`${RENDER_API}/services?limit=100&type=web_service`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Render list error: ${res.status}`);

  const data = await res.json() as any[];
  const agents = data.filter((s: any) => s.service?.name?.startsWith('agentbot-agent-'));

  return JSON.stringify(agents.map((s: any) => ({
    name: s.service.name,
    id: s.service.id,
    status: s.service.suspended,
    url: s.service.serviceDetails?.url,
    plan: s.service.serviceDetails?.plan,
  })), null, 2);
}

/**
 * Build image — no-op on Render (auto-built from Dockerfile)
 */
export async function buildImage(): Promise<string> {
  return 'Render auto-builds from Dockerfile. No manual build needed.';
}

/**
 * Health check for a user's agent
 */
export async function checkHealth(userId: string): Promise<boolean> {
  try {
    const status = await getContainerStatus(userId);
    if (status.status !== 'running' || !status.url) return false;

    const res = await fetch(`${status.url}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Resume on activity
 */
export async function resumeOnActivity(userId: string): Promise<ContainerResult> {
  const status = await getContainerStatus(userId);
  if (status.status === 'suspended') {
    return startContainer(userId);
  }
  return status;
}

/**
 * Idle auto-pause timers
 */
const idleTimers: Map<string, NodeJS.Timeout> = new Map();

export function resetIdleTimer(
  userId: string,
  idleMinutes: number = 30
): void {
  const existing = idleTimers.get(userId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    try {
      await pauseContainer(userId);
      console.log(`[ContainerManager/Render] Auto-suspended idle agent for ${userId}`);
    } catch (err: any) {
      console.error(`[ContainerManager/Render] Failed to suspend ${userId}:`, err.message);
    }
    idleTimers.delete(userId);
  }, idleMinutes * 60 * 1000);

  idleTimers.set(userId, timer);
}

/**
 * Look up a Render service ID by name
 */
async function getServiceIdByName(name: string): Promise<string | null> {
  const res = await fetch(`${RENDER_API}/services?limit=100&type=web_service`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return null;

  const data = await res.json() as any[];
  const match = data.find((s: any) => s.service?.name === name);
  return match?.service?.id || null;
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
