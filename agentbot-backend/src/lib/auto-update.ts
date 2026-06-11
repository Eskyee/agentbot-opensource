import { promises as fs } from 'fs';
import { runCommand } from '../utils/secure-exec';
import { log } from './logger';
import { OPENCLAW_RUNTIME_VERSION } from './openclaw-version';
import { getContainerInspect, getContainerName, recreateContainerWithImage, runOpenClawPostUpdateChecks } from './docker';
import { readPorts, getNextPortAndAssign } from './ports';
import { readAgentMetadata } from './agent-metadata';

const OPENCLAW_REPO = 'OpenClaw/openclaw';

export async function checkForOpenClawUpdate(): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${OPENCLAW_REPO}/releases/latest`, {
      headers: { 'User-Agent': 'Agentbot' },
    });
    if (!response.ok) return null;

    const release = await response.json() as { tag_name?: string; name?: string };
    const latestVersion = release.tag_name?.replace(/^v/, '') || release.name?.replace(/^v/, '');

    if (latestVersion && latestVersion !== OPENCLAW_RUNTIME_VERSION) {
      log.info('[Auto-Update] New version available', { details: { latestVersion, current: OPENCLAW_RUNTIME_VERSION } })
      return latestVersion;
    }
    return null;
  } catch (error) {
    log.error('[Auto-Update] Failed to check for updates', { error: { error: error instanceof Error ? error.message : String(error) } })
    return null;
  }
}

export async function updateAllContainers(
  newVersion: string,
  dataDir: string,
  homeDir: string,
  getPlanResources: (p: string) => { memory: string; cpus: string }
): Promise<{ success: number; failed: number; skipped: number }> {
  try {
    await runCommand('docker', ['version', '--format', '{{.Server.Version}}']);
  } catch {
    log.warn('[Auto-Update] Docker not available — skipping');
    return { success: 0, failed: 0, skipped: 0 };
  }

  const ports = await readPorts(dataDir);
  const results = { success: 0, failed: 0, skipped: 0 };
  const newImage = `ghcr.io/openclaw/openclaw:${newVersion}`;
  const agentIds = Object.keys(ports);

  if (agentIds.length === 0) return results;

  log.info('[Auto-Update] Pulling image', { details: { image: newImage } })
  try {
    await runCommand('docker', ['pull', newImage]);
  } catch (err: any) {
    log.error('[Auto-Update] Failed to pull image', { error: { error: err.message } })
    return { success: 0, failed: 0, skipped: 0 };
  }

  const CONCURRENCY = 5;
  for (let i = 0; i < agentIds.length; i += CONCURRENCY) {
    const batch = agentIds.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(batch.map(async (agentId) => {
      const containerName = getContainerName(agentId);
      const inspect = await getContainerInspect(containerName);
      if (inspect.Config.Image === newImage) return 'skipped';

      const metadata = await readAgentMetadata(dataDir, agentId);
      const resources = getPlanResources(metadata?.plan || 'starter');

      await runCommand('docker', ['stop', containerName]);
      await runCommand('docker', ['rm', containerName]);
      const port = await getNextPortAndAssign(agentId, dataDir);
      await runCommand('docker', [
        'run', '-d', '--name', containerName, '--restart', 'unless-stopped',
        '--memory', resources.memory, '--cpus', resources.cpus,
        '-v', `openclaw-data-${agentId}:${homeDir}`, '-p', `${port}:18789`, newImage,
      ]);
      await runOpenClawPostUpdateChecks(containerName);
    }));

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        result.value === 'skipped' ? results.skipped++ : results.success++;
      } else {
        log.error('[Auto-Update] Batch failure', { error: { reason: String(result.reason) } })
        results.failed++;
      }
    }
  }
  return results;
}

let autoUpdaterStarted = false;

export function startAutoUpdater(
  dataDir: string, homeDir: string,
  getPlanResources: (p: string) => { memory: string; cpus: string }
) {
  if (autoUpdaterStarted) return;
  autoUpdaterStarted = true;
  log.info('[Auto-Update] Scheduler initialized');

  const checkAndUpdate = async () => {
    const latestVersion = await checkForOpenClawUpdate();
    const targetVersion = latestVersion || OPENCLAW_RUNTIME_VERSION;
    const results = await updateAllContainers(targetVersion, dataDir, homeDir, getPlanResources);
    log.info('[Auto-Update] Complete', { details: { success: results.success, skipped: results.skipped, failed: results.failed } })
  };

  const intervalMs = 24 * 60 * 60 * 1000;
  setInterval(checkAndUpdate, intervalMs);
  setTimeout(checkAndUpdate, 5000);
}
