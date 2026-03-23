/**
 * Agentbot Container Manager
 * Handles on-demand Docker container provisioning via the provision.sh script.
 *
 * MED-06 / spawn() pattern (index.ts template):
 *  All exec() calls replaced with spawn() via runCommand(cmd, args[]).
 *  The provision script path and operation are constants; userId/plan are
 *  passed as discrete argv elements — never interpolated into a shell string.
 *
 * DATA_DIR: removed hardcoded personal path (/Users/raveculture/...).
 *  Use AGENTBOT_DATA_DIR env var; defaults to the standard /opt/agentbot/data.
 *
 * checkHealth: exec('curl ...') replaced with native fetch() — no shell needed.
 */
import path from 'path';
import { runCommand } from '../utils';

const PROVISION_SCRIPT = path.join(__dirname, '../../docker/provision.sh');
const DATA_DIR = process.env.AGENTBOT_DATA_DIR || '/opt/agentbot/data';

// Docker availability cache — checked once on first use
let dockerChecked = false;
let dockerAvailable = false;

async function ensureDockerAvailable(): Promise<void> {
  if (!dockerChecked) {
    try {
      await runCommand('docker', ['version', '--format', '{{.Server.Version}}'], { timeout: 5000 });
      dockerAvailable = true;
    } catch {
      dockerAvailable = false;
    }
    dockerChecked = true;
  }
  if (!dockerAvailable) {
    throw new Error('Docker is not available on this server. Container provisioning requires Docker-in-Docker. Contact support.');
  }
}

export interface ContainerResult {
  container: string;
  status: string;
  port?: number;
  startedAt?: string;
}

export type PlanType = 'solo' | 'collective' | 'label' | 'network';

/**
 * Check if Docker is available (non-throwing).
 */
export async function isDockerReady(): Promise<boolean> {
  await ensureDockerAvailable().catch(() => {});
  return dockerAvailable;
}

/**
 * Create and start a new agent container for a user.
 * argv: bash <script> create <userId> <plan>  — no shell interpolation.
 */
export async function createContainer(
  userId: string,
  plan: PlanType = 'solo'
): Promise<ContainerResult> {
  await ensureDockerAvailable();
  const { stdout } = await runCommand('bash', [PROVISION_SCRIPT, 'create', userId, plan]);
  return JSON.parse(stdout.trim()) as ContainerResult;
}

/**
 * Start or resume a container.
 */
export async function startContainer(userId: string): Promise<ContainerResult> {
  await ensureDockerAvailable();
  const { stdout } = await runCommand('bash', [PROVISION_SCRIPT, 'start', userId]);
  return JSON.parse(stdout.trim()) as ContainerResult;
}

/**
 * Pause a running container (frees memory, keeps data).
 */
export async function pauseContainer(userId: string): Promise<ContainerResult> {
  await ensureDockerAvailable();
  const { stdout } = await runCommand('bash', [PROVISION_SCRIPT, 'pause', userId]);
  return JSON.parse(stdout.trim()) as ContainerResult;
}

/**
 * Destroy a container (optionally backup user data).
 */
export async function destroyContainer(
  userId: string,
  backup: boolean = true
): Promise<ContainerResult> {
  await ensureDockerAvailable();
  const { stdout } = await runCommand('bash', [PROVISION_SCRIPT, 'destroy', userId, String(backup)]);
  return JSON.parse(stdout.trim()) as ContainerResult;
}

/**
 * Get container status for a user.
 */
export async function getContainerStatus(userId: string): Promise<ContainerResult> {
  await ensureDockerAvailable();
  const { stdout } = await runCommand('bash', [PROVISION_SCRIPT, 'status', userId]);
  return JSON.parse(stdout.trim()) as ContainerResult;
}

/**
 * List all agent containers (returns raw script output).
 */
export async function listContainers(): Promise<string> {
  await ensureDockerAvailable();
  const { stdout } = await runCommand('bash', [PROVISION_SCRIPT, 'list']);
  return stdout;
}

/**
 * Build the agent Docker image.
 */
export async function buildImage(): Promise<string> {
  await ensureDockerAvailable();
  const { stdout } = await runCommand('bash', [PROVISION_SCRIPT, 'build']);
  return stdout;
}

/**
 * Check if a container is healthy by probing its HTTP health endpoint.
 * Uses native fetch() instead of exec('curl ...') — no shell required.
 */
export async function checkHealth(userId: string): Promise<boolean> {
  try {
    const status = await getContainerStatus(userId);
    if (status.status !== 'running' || !status.port) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`http://127.0.0.1:${status.port}/health`, {
        signal: controller.signal,
      });
      return res.status === 200;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

/**
 * Resume a paused or exited container on user activity.
 */
export async function resumeOnActivity(userId: string): Promise<ContainerResult> {
  const status = await getContainerStatus(userId);
  if (status.status === 'paused' || status.status === 'exited' || status.status === 'created') {
    return startContainer(userId);
  }
  return status;
}

/**
 * Reset the idle auto-pause timer for a container.
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
      console.log(`[ContainerManager] Auto-paused idle container for ${userId}`);
    } catch (err: any) {
      console.error(`[ContainerManager] Failed to auto-pause ${userId}:`, err.message);
    }
    idleTimers.delete(userId);
  }, idleMinutes * 60 * 1000);

  idleTimers.set(userId, timer);
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
};
