/**
 * Container health checks
 * Verifies containers are running and responding
 * 
 * NOTE: This module is part of the planned Docker/Caddy integration.
 * See plans/BACKEND_CONSOLIDATION_PLAN.md for implementation roadmap.
 * Currently not imported in the main application.
 */

import { runCommand, sleep, escapeShellArg } from '../utils';

export interface ContainerHealth {
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopped';
  lastCheck: string;
  startedAt?: string;
}

export const checkContainerHealth = async (
  containerName: string,
  maxRetries: number = 10
): Promise<ContainerHealth> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { stdout } = await runCommand(
        `docker inspect ${escapeShellArg(containerName)} --format '{{.State.Status}}|{{.State.StartedAt}}'`
      );
      
      const [status, startedAt] = stdout.trim().split('|');
      
      if (status === 'running') {
        try {
          await runCommand(`docker exec ${escapeShellArg(containerName)} curl -sf localhost:18789/health`, { timeout: 5000 });
          return { status: 'healthy', lastCheck: new Date().toISOString(), startedAt };
        } catch {
          if (attempt < maxRetries) { await sleep(2000); continue; }
          return { status: 'starting', lastCheck: new Date().toISOString(), startedAt };
        }
      }
      
      return { status: status === 'exited' ? 'stopped' : 'unhealthy', lastCheck: new Date().toISOString() };
    } catch {
      if (attempt < maxRetries) { await sleep(1000); continue; }
      return { status: 'unhealthy', lastCheck: new Date().toISOString() };
    }
  }
  return { status: 'unhealthy', lastCheck: new Date().toISOString() };
};

export const waitForHealthy = async (
  containerName: string,
  timeoutMs: number = 60000
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const health = await checkContainerHealth(containerName, 1);
    if (health.status === 'healthy') return true;
    if (health.status === 'stopped') return false;
    await sleep(2000);
  }
  return false;
};
