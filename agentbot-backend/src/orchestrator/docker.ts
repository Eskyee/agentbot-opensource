import { IAgentRuntime, AgentInstance, RuntimeOptions, AgentStatus } from './types';
import { runCommand, SecureExec } from '../utils/secure-exec';
import { log } from '../lib/logger';
import { IStorageProvider } from './types';

/**
 * DockerRuntime implements agent lifecycle management using local Docker.
 */
export class DockerRuntime implements IAgentRuntime {
  constructor(private storage: IStorageProvider) {}

  private getContainerName(id: string): string {
    return `openclaw-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  }

  async deploy(id: string, options: RuntimeOptions): Promise<AgentInstance> {
    const containerName = this.getContainerName(id);
    log.info('DockerRuntime', { event: 'deploy_start', id, image: options.image });

    // 1. Ensure volume exists
    const volumeName = await this.storage.createVolume(id);

    // 2. Prepare environment arguments
    const envArgs: string[] = [];
    for (const [key, value] of Object.entries(options.env)) {
      envArgs.push('-e', `${key}=${value}`);
    }

    // 3. Prepare port arguments
    const portArgs: string[] = [];
    for (const [containerPort, hostPort] of Object.entries(options.ports)) {
      portArgs.push('-p', `${hostPort}:${containerPort}`);
    }

    // 4. Prepare volume arguments
    const volumeArgs: string[] = [];
    for (const vol of options.volumes) {
      volumeArgs.push('-v', `${vol.source}:${vol.target}`);
    }

    // 5. Run the container
    try {
      // Cleanup existing if any
      await runCommand('docker', ['rm', '-f', containerName]).catch(() => {});

      await runCommand('docker', [
        'run', '-d',
        '--name', containerName,
        '--restart', 'unless-stopped',
        `--memory=${options.memory}`,
        `--cpus=${options.cpus}`,
        ...envArgs,
        ...portArgs,
        ...volumeArgs,
        options.image
      ]);

      const instance = await this.status(id);
      log.info('DockerRuntime', { event: 'deploy_success', id, containerId: instance.runtimeId });
      return instance;
    } catch (error) {
      log.error('DockerRuntime', { event: 'deploy_failed', id, error: String(error) });
      throw error;
    }
  }

  async start(id: string): Promise<void> {
    await runCommand('docker', ['start', this.getContainerName(id)]);
  }

  async stop(id: string): Promise<void> {
    await runCommand('docker', ['stop', this.getContainerName(id)]);
  }

  async list(): Promise<AgentInstance[]> {
    try {
      const { stdout } = await runCommand('docker', [
        'ps', '-a', '--filter', 'name=openclaw-', '--format', '{{.Names}}|{{.Status}}'
      ]);
      const lines = stdout ? stdout.split('\n') : [];
      return lines.filter(Boolean).map(line => {
        const [name, statusRaw] = line.split('|');
        const id = name.replace('openclaw-', '');
        return {
          id,
          name: id,
          plan: 'unknown',
          status: statusRaw.toLowerCase().includes('up') ? 'active' : 'stopped',
          metadata: { rawStatus: statusRaw }
        };
      });
    } catch (error) {
      log.error('DockerRuntime', { event: 'list_failed', error: String(error) });
      return [];
    }
  }

  async status(id: string): Promise<AgentInstance> {
    const containerName = this.getContainerName(id);
    try {
      const { stdout } = await runCommand('docker', [
        'inspect', 
        containerName, 
        '--format', 
        '{{.Id}}|{{.State.Status}}|{{.State.StartedAt}}'
      ]);
      
      const [containerId, rawStatus, startedAt] = stdout.split('|');
      
      let status: AgentStatus = 'provisioning';
      if (rawStatus === 'running') status = 'active';
      else if (rawStatus === 'exited') status = 'stopped';
      else if (rawStatus === 'created') status = 'provisioning';
      else status = 'failed';

      return {
        id,
        name: id, // Registry will hydrate the real name
        plan: 'unknown',
        status,
        runtimeId: containerId.substring(0, 12),
        metadata: {
          containerName,
          startedAt,
          rawStatus
        }
      };
    } catch (error) {
      return {
        id,
        name: id,
        plan: 'unknown',
        status: 'failed',
        metadata: { error: String(error) }
      };
    }
  }

  async destroy(id: string): Promise<void> {
    const containerName = this.getContainerName(id);
    await runCommand('docker', ['rm', '-f', containerName]).catch(() => {});
    await this.storage.deleteVolume(id);
  }

  async logs(id: string, lines: number = 100): Promise<string> {
    const { stdout } = await runCommand('docker', ['logs', '--tail', String(lines), this.getContainerName(id)]);
    return stdout;
  }
}
