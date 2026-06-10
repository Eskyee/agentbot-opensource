import { promises as fs } from 'fs';
import path from 'path';
import { runCommand, SecureExec } from '../utils/secure-exec';
import { log } from './logger';
import { OPENCLAW_RUNTIME_VERSION } from './openclaw-version';

const OPENCLAW_HOME_DIR = '/root/.openclaw';
const OPENCLAW_CONFIG_PATH = `${OPENCLAW_HOME_DIR}/openclaw.json`;
const DOCKER_VOLUME_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export type ContainerMount = {
  Type: string;
  Name?: string;
  Source?: string;
  Destination: string;
};

export type ContainerInspect = {
  Config: { Image: string };
  HostConfig: { Memory: number; NanoCpus: number };
  Mounts: ContainerMount[];
  NetworkSettings: {
    Ports: { '18789/tcp'?: Array<{ HostPort: string }> };
  };
};

export const sanitizeAgentId = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');
export const isValidDockerImage = (value: string): boolean => /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?::[0-9]{2,5})?)\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[A-Fa-f0-9]{64})?$/.test(value);
export const getContainerName = (agentId: string): string => `openclaw-${sanitizeAgentId(agentId)}`;

export const getContainerInspect = async (containerName: string): Promise<ContainerInspect> => {
  const { stdout } = await runCommand('docker', ['inspect', containerName]);
  let parsed: ContainerInspect[];
  try {
    parsed = JSON.parse(stdout) as ContainerInspect[];
  } catch (e) {
    throw new Error(`Failed to parse docker inspect output: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!parsed[0]) throw new Error('Container inspect returned no data');
  return parsed[0];
};

export const containerStatus = async (containerName: string): Promise<{ status: string; startedAt?: string } | null> => {
  try {
    const { stdout } = await runCommand('docker', ['inspect', containerName, '--format', '{{.State.Status}}|{{.State.StartedAt}}']);
    const [rawStatus, startedAt] = stdout.split('|');
    return { status: rawStatus === 'running' ? 'active' : rawStatus === 'exited' ? 'stopped' : rawStatus, startedAt };
  } catch {
    return null;
  }
};

export const backupContainerData = async (containerName: string, inspect: ContainerInspect, backupDir: string): Promise<string | null> => {
  const instanceId = containerName.replace('openclaw-', '');
  const mount = inspect.Mounts.find((m) => m.Destination === OPENCLAW_HOME_DIR);
  if (!mount) return null;

  const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const dir = path.join(backupDir, instanceId);
  const backupFile = path.join(dir, `${ts}.tar.gz`);
  await fs.mkdir(dir, { recursive: true });

  if (mount.Type === 'volume' && mount.Name) {
    if (!DOCKER_VOLUME_NAME_REGEX.test(mount.Name)) {
      throw new Error(`Unsafe docker volume name for backup: ${mount.Name}`);
    }
    await SecureExec.dockerBackup(mount.Name, backupFile);
    return backupFile;
  }
  return null;
};

export const recreateContainerWithImage = async (
  containerName: string, inspect: ContainerInspect, image: string,
  plan: string, homeDir: string, getPlanResources: (p: string) => { memory: string; cpus: string }
): Promise<void> => {
  const portMapping = inspect.NetworkSettings.Ports['18789/tcp'];
  const hostPort = portMapping && portMapping[0]?.HostPort;
  if (!hostPort) throw new Error('Could not determine host port');

  const mount = inspect.Mounts.find((m) => m.Destination === homeDir);
  if (!mount) throw new Error('Could not determine data mount');

  const mountType = mount.Type === 'volume' && mount.Name ? 'volume' : (mount.Type === 'bind' && mount.Source ? 'bind' : '');
  if (!mountType) throw new Error('Unsupported mount configuration');

  const mountSource = mountType === 'volume' ? mount.Name : mount.Source;
  const resources = getPlanResources(plan);

  await runCommand('docker', [
    'run', '-d', '--name', containerName, '--restart', 'unless-stopped',
    '-p', `${hostPort}:18789`, `--memory=${resources.memory}`, `--cpus=${resources.cpus}`,
    '-v', `${mountSource}:${homeDir}`, image,
  ]);
};

export const getContainerRuntimeVersion = async (containerName: string): Promise<string> => {
  try {
    const script = `const fs=require('fs');const p='${OPENCLAW_CONFIG_PATH}';if(!fs.existsSync(p)){console.log('');process.exit(0)}const c=JSON.parse(fs.readFileSync(p,'utf8'));console.log(c?.meta?.lastTouchedVersion||'');`;
    const encoded = Buffer.from(script, 'utf8').toString('base64');
    const { stdout } = await runCommand('docker', ['exec', containerName, 'sh', '-lc', `echo "${encoded}" | base64 -d > /tmp/version.js && node /tmp/version.js`]);
    return stdout || OPENCLAW_RUNTIME_VERSION;
  } catch {
    return OPENCLAW_RUNTIME_VERSION;
  }
};

export const runOpenClawPostUpdateChecks = async (containerName: string): Promise<{ doctor: string; gatewayRestart: string; health: string }> => {
  const runOpenClaw = async (args: string[]) => {
    const { stdout, stderr } = await runCommand('docker', ['exec', containerName, 'openclaw', ...args]);
    return stdout || stderr || 'ok';
  };
  return {
    doctor: await runOpenClaw(['doctor']),
    gatewayRestart: await runOpenClaw(['gateway', 'restart']),
    health: await runOpenClaw(['health']),
  };
};

export const healLegacyModelInContainer = async (containerName: string): Promise<{ healed: boolean; message: string }> => {
  try {
    const script = `const fs=require('fs');const p='${OPENCLAW_CONFIG_PATH}';const legacy={"openrouter/google/gemini-2.0-flash-exp:free":"openrouter/openai/gpt-4o-mini"};if(!fs.existsSync(p)){console.log('skip:no-config');process.exit(0)}const c=JSON.parse(fs.readFileSync(p,'utf8'));const current=c?.agents?.defaults?.model?.primary;if(!current||!legacy[current]){console.log('skip:no-legacy');process.exit(0)}c.agents=c.agents||{};c.agents.defaults=c.agents.defaults||{};c.agents.defaults.model={primary:legacy[current]};fs.writeFileSync(p,JSON.stringify(c,null,2));console.log('healed:'+current+'->'+legacy[current]);`;
    const encoded = Buffer.from(script, 'utf8').toString('base64');
    const { stdout } = await runCommand('docker', ['exec', containerName, 'sh', '-lc', `echo "${encoded}" | base64 -d > /tmp/heal-model.js && node /tmp/heal-model.js`]);
    return stdout.startsWith('healed:') ? { healed: true, message: stdout } : { healed: false, message: stdout || 'skip' };
  } catch {
    return { healed: false, message: 'skip:container-not-running' };
  }
};

export const ensureDataDirs = async (dataDir: string): Promise<void> => {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(path.join(dataDir, 'instances'), { recursive: true });
  await fs.mkdir(path.join(dataDir, 'agents'), { recursive: true });
};
