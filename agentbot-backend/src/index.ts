import express, { Request, Response } from 'express';
import inviteRouter from './invite';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.INTERNAL_API_KEY;
const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:2026.2.25';
const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'google/gemini-2.0-flash';
const UPDATE_BACKUP_DIR = path.join(DATA_DIR, 'backups', 'openclaw-updates');
const OPENCLAW_RUNTIME_VERSION = process.env.OPENCLAW_RUNTIME_VERSION || '2026.2.25';
const DOCKER_IMAGE_REGEX = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?::[0-9]{2,5})?)\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[A-Fa-f0-9]{64})?$/;
const DOCKER_VOLUME_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

if (!API_KEY && process.env.NODE_ENV === 'production') {
  console.error('FATAL: INTERNAL_API_KEY environment variable is required in production');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://agentbot.com'],
  credentials: true,
}));
app.use(express.json());
app.use('/api/invite', inviteRouter);

type AgentMetadata = {
  agentId: string;
  createdAt: string;
  plan: string;
  aiProvider: string;
  port: number;
  subdomain: string;
  gatewayToken?: string;
};

type ContainerMount = {
  Type: string;
  Name?: string;
  Source?: string;
  Destination: string;
};

type ContainerInspect = {
  Config: {
    Image: string;
  };
  HostConfig: {
    Memory: number;
    NanoCpus: number;
  };
  Mounts: ContainerMount[];
  NetworkSettings: {
    Ports: {
      '18789/tcp'?: Array<{ HostPort: string }>;
    };
  };
};

const runCommand = (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
};

const escapeShellArg = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

const LEGACY_MODEL_MAP: Record<string, string> = {
  'openrouter/google/gemini-2.0-flash-exp:free': 'openrouter/openai/gpt-4o-mini',
};

const healLegacyModelInContainer = async (containerName: string): Promise<{ healed: boolean; message: string }> => {
  try {
    const script = `
const fs=require('fs');
const p='/home/node/.openclaw/openclaw.json';
const legacy={"openrouter/google/gemini-2.0-flash-exp:free":"openrouter/openai/gpt-4o-mini"};
if(!fs.existsSync(p)){console.log('skip:no-config');process.exit(0)}
const c=JSON.parse(fs.readFileSync(p,'utf8'));
const current=c?.agents?.defaults?.model?.primary;
if(!current||!legacy[current]){console.log('skip:no-legacy');process.exit(0)}
c.agents=c.agents||{};
c.agents.defaults=c.agents.defaults||{};
c.agents.defaults.model={primary:legacy[current]};
fs.writeFileSync(p,JSON.stringify(c,null,2));
console.log('healed:'+current+'->'+legacy[current]);
`;

    const encoded = Buffer.from(script, 'utf8').toString('base64');
    const { stdout } = await runCommand(
      `docker exec ${containerName} sh -lc "echo ${escapeShellArg(encoded)} | base64 -d > /tmp/heal-model.js && node /tmp/heal-model.js"`,
    );

    if (stdout.startsWith('healed:')) {
      return { healed: true, message: stdout };
    }
    return { healed: false, message: stdout || 'skip' };
  } catch {
    return { healed: false, message: 'skip:container-not-running' };
  }
};

const getContainerInspect = async (containerName: string): Promise<ContainerInspect> => {
  const { stdout } = await runCommand(`docker inspect ${containerName}`);
  const parsed = JSON.parse(stdout) as ContainerInspect[];
  if (!parsed[0]) {
    throw new Error('Container inspect returned no data');
  }
  return parsed[0];
};

const backupContainerData = async (containerName: string, inspect: ContainerInspect): Promise<string | null> => {
  const instanceId = containerName.replace('openclaw-', '');
  const mount = inspect.Mounts.find((m) => m.Destination === '/home/node/.openclaw');
  if (!mount) {
    return null;
  }

  const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const backupDir = path.join(UPDATE_BACKUP_DIR, instanceId);
  const backupFile = path.join(backupDir, `${ts}.tar.gz`);
  await fs.mkdir(backupDir, { recursive: true });

  if (mount.Type === 'volume' && mount.Name) {
    if (!DOCKER_VOLUME_NAME_REGEX.test(mount.Name)) {
      throw new Error(`Unsafe docker volume name for backup: ${mount.Name}`);
    }

    await runCommand(
      `sh -lc "docker run --rm -v ${mount.Name}:/data:ro alpine sh -lc 'tar czf - -C /data .' > ${escapeShellArg(backupFile)}"`,
    );
    return backupFile;
  }

  if (mount.Type === 'bind' && mount.Source) {
    return null;
  }

  return null;
};

const recreateContainerWithImage = async (containerName: string, inspect: ContainerInspect, image: string): Promise<void> => {
  const portMapping = inspect.NetworkSettings.Ports['18789/tcp'];
  const hostPort = portMapping && portMapping[0]?.HostPort;
  if (!hostPort) {
    throw new Error('Could not determine host port');
  }

  const mount = inspect.Mounts.find((m) => m.Destination === '/home/node/.openclaw');
  if (!mount) {
    throw new Error('Could not determine data mount');
  }

  const mountArg = mount.Type === 'volume' && mount.Name
    ? `-v ${mount.Name}:/home/node/.openclaw`
    : (mount.Type === 'bind' && mount.Source ? `-v ${mount.Source}:/home/node/.openclaw` : '');

  if (!mountArg) {
    throw new Error('Unsupported mount configuration');
  }

  const args: string[] = [
    'docker run -d',
    `--name ${containerName}`,
    '--restart unless-stopped',
    `-p ${hostPort}:18789`,
    '--memory=1g',
    '--cpus=1',
  ];

  args.push(mountArg);
  args.push(image);

  await runCommand(args.join(' '));
};

const getContainerRuntimeVersion = async (containerName: string): Promise<string> => {
  try {
    const script = `
const fs=require('fs');
const p='/home/node/.openclaw/openclaw.json';
if(!fs.existsSync(p)){console.log('');process.exit(0)}
const c=JSON.parse(fs.readFileSync(p,'utf8'));
console.log(c?.meta?.lastTouchedVersion||'');
`;
    const encoded = Buffer.from(script, 'utf8').toString('base64');
    const { stdout } = await runCommand(
      `docker exec ${containerName} sh -lc "echo ${escapeShellArg(encoded)} | base64 -d > /tmp/version.js && node /tmp/version.js"`,
    );
    return stdout || OPENCLAW_RUNTIME_VERSION;
  } catch {
    return OPENCLAW_RUNTIME_VERSION;
  }
};

const ensureDataDirs = async (): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'instances'), { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'agents'), { recursive: true });
};

const sanitizeAgentId = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');
const isValidDockerImage = (value: string): boolean => DOCKER_IMAGE_REGEX.test(value);

const getContainerName = (agentId: string): string => `openclaw-${sanitizeAgentId(agentId)}`;

const portsFilePath = (): string => path.join(DATA_DIR, 'ports.json');

const readPorts = async (): Promise<Record<string, number>> => {
  try {
    const raw = await fs.readFile(portsFilePath(), 'utf8');
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
};

const writePorts = async (ports: Record<string, number>): Promise<void> => {
  await fs.writeFile(portsFilePath(), JSON.stringify(ports, null, 2));
};

const getNextPort = async (): Promise<number> => {
  const ports = await readPorts();
  const usedPorts = Object.values(ports);
  const maxPort = usedPorts.length > 0 ? Math.max(...usedPorts) : BASE_PORT - 1;
  return maxPort + 1;
};

const agentFilePath = (agentId: string): string => path.join(DATA_DIR, 'agents', `${sanitizeAgentId(agentId)}.json`);

const readAgentMetadata = async (agentId: string): Promise<AgentMetadata | null> => {
  try {
    const raw = await fs.readFile(agentFilePath(agentId), 'utf8');
    return JSON.parse(raw) as AgentMetadata;
  } catch {
    return null;
  }
};

const writeAgentMetadata = async (agent: AgentMetadata): Promise<void> => {
  await fs.writeFile(agentFilePath(agent.agentId), JSON.stringify(agent, null, 2));
};

const containerStatus = async (containerName: string): Promise<{ status: string; startedAt?: string } | null> => {
  try {
    const { stdout } = await runCommand(`docker inspect ${containerName} --format '{{.State.Status}}|{{.State.StartedAt}}'`);
    const [rawStatus, startedAt] = stdout.split('|');
    let status = rawStatus;
    if (rawStatus === 'running') {
      status = 'active';
    } else if (rawStatus === 'exited') {
      status = 'stopped';
    }
    return { status, startedAt };
  } catch {
    return null;
  }
};

const createOpenClawConfig = (
  telegramToken: string,
  aiProvider: string,
  apiKey?: string,
  ownerIds?: string[],
): Record<string, unknown> => {
  const envVars: Record<string, string> = {};
  let model = DEFAULT_MODEL;

  const provider = aiProvider || 'openrouter';
  const providedKey = (apiKey || '').trim();

  const resolvedKey = (name: string): string => {
    if (providedKey) {
      return providedKey;
    }
    return (process.env[name] || '').trim();
  };

  if (provider === 'gemini' || provider === 'google') {
    const key = resolvedKey('GEMINI_API_KEY');
    if (!key) {
      throw new Error('Missing AI API key: set Gemini key in onboarding or server env');
    }
    envVars.GEMINI_API_KEY = key;
    model = 'google/gemini-2.0-flash';
  } else if (provider === 'groq') {
    const key = resolvedKey('GROQ_API_KEY');
    if (!key) {
      throw new Error('Missing AI API key: set Groq key in onboarding or server env');
    }
    envVars.GROQ_API_KEY = key;
    model = 'groq/gemma2-9b-it';
  } else if (provider === 'anthropic') {
    const key = resolvedKey('ANTHROPIC_API_KEY');
    if (!key) {
      throw new Error('Missing AI API key: set Anthropic key in onboarding or server env');
    }
    envVars.ANTHROPIC_API_KEY = key;
    model = 'anthropic/claude-sonnet-4-5';
  } else if (provider === 'openai') {
    const key = resolvedKey('OPENAI_API_KEY');
    if (!key) {
      throw new Error('Missing AI API key: set OpenAI key in onboarding or server env');
    }
    envVars.OPENAI_API_KEY = key;
    model = 'openai/gpt-4o';
  } else if (provider === 'openrouter') {
    const key = resolvedKey('OPENROUTER_API_KEY');
    if (!key) {
      throw new Error('Missing AI API key: set OpenRouter key in onboarding or server env');
    }
    envVars.OPENROUTER_API_KEY = key;
    model = 'moonshotai/kimi-k2.5';
  } else {
    throw new Error(`Unsupported aiProvider: ${provider}`);
  }

  const config: Record<string, unknown> = {
    env: { vars: envVars },
    agents: {
      defaults: {
        model: { primary: model },
      },
    },
    channels: {
      telegram: {
        enabled: true,
        botToken: telegramToken,
        dmPolicy: 'allowlist',
        allowFrom: [],
      },
    },
    gateway: {
      mode: 'local',
      port: 18789,
    },
    plugins: {
      entries: {
        telegram: {
          enabled: true,
        },
      },
    },
  };

  if (ownerIds && ownerIds.length > 0) {
    (config.channels as { telegram: Record<string, unknown> }).telegram.allowFrom = ownerIds;
    (config.channels as { telegram: Record<string, unknown> }).telegram.dmPolicy = 'allowlist';
  }

  return config;
};

// Auth middleware
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);
  if (token !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/openclaw/version', (_req: Request, res: Response) => {
  res.json({
    openclawVersion: OPENCLAW_RUNTIME_VERSION,
    image: OPENCLAW_IMAGE,
    deployedAt: new Date().toISOString(),
  });
});

app.get('/api/openclaw/instances', authenticate, async (_req: Request, res: Response) => {
  try {
    const { stdout } = await runCommand(`docker ps --filter "name=openclaw-" --format "{{.Names}}|{{.Image}}|{{.Status}}|{{.CreatedAt}}"`);
    const lines = stdout ? stdout.split('\n').filter(Boolean) : [];
    const instances = await Promise.all(lines.map(async (line) => {
      const [name, image, status, createdAt] = line.split('|');
      const agentId = name.replace('openclaw-', '');
      const metadata = await readAgentMetadata(agentId);
      
      let containerVersion = 'unknown';
      try {
        const { stdout: versionOutput } = await runCommand(`docker exec ${name} openclaw --version 2>/dev/null || echo "unknown"`);
        containerVersion = versionOutput.trim() || 'unknown';
      } catch {
        containerVersion = 'unknown';
      }
      
      return {
        agentId,
        name,
        image,
        status,
        createdAt,
        version: containerVersion,
        metadata,
      };
    }));
    res.json({ instances, count: instances.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list instances' });
  }
});

app.get('/api/openclaw/instances/:id/stats', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  
  try {
    const { stdout: stats } = await runCommand(
      `docker stats ${containerName} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}"`
    );
    
    const { stdout: inspect } = await runCommand(
      `docker inspect ${containerName} --format "{{.State.StartedAt}}|{{.State.Status}}"`
    );
    
    const [cpu, memUsage, memPerc, netIO, blockIO, pids] = stats.trim().split('|');
    const [startedAt, status] = inspect.trim().split('|');
    
    const startTime = new Date(startedAt);
    const uptime = Date.now() - startTime.getTime();
    
    res.json({
      agentId: id,
      cpu: cpu || '0%',
      memory: memUsage || '0MiB / 0MiB',
      memoryPercent: memPerc || '0%',
      network: netIO || '0B / 0B',
      blockIO: blockIO || '0B / 0B',
      pids: pids || '0',
      status: status || 'unknown',
      uptime: uptime,
      uptimeFormatted: formatUptime(uptime),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get container stats' });
  }
});

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Agents endpoints
app.get('/api/agents', authenticate, (req: Request, res: Response) => {
  runCommand(`docker ps -a --filter "name=openclaw-" --format "{{.Names}}|{{.Status}}"`)
    .then(async ({ stdout }) => {
      const lines = stdout ? stdout.split('\n') : [];
      const agents = await Promise.all(lines.filter(Boolean).map(async (line) => {
        const [name, statusRaw] = line.split('|');
        const agentId = name.replace('openclaw-', '');
        const metadata = await readAgentMetadata(agentId);
        return {
          id: agentId,
          status: statusRaw.toLowerCase().includes('up') ? 'active' : 'stopped',
          created: metadata?.createdAt || new Date().toISOString(),
          subdomain: metadata?.subdomain || `${agentId}.${AGENTS_DOMAIN}`,
          url: `https://${metadata?.subdomain || `${agentId}.${AGENTS_DOMAIN}`}`,
        };
      }));
      res.json(agents);
    })
    .catch(() => {
      res.json([]);
    });
});

app.post('/api/agents', authenticate, (req: Request, res: Response) => {
  const { name, config } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  // TODO: Create agent in database and deploy
  res.status(201).json({ id: 'new-agent-id', name, status: 'deploying' });
});

app.get('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  Promise.all([containerStatus(containerName), readAgentMetadata(id), getContainerRuntimeVersion(containerName)])
    .then(([runtime, metadata, openclawVersion]) => {
      if (!runtime && !metadata) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      const subdomain = metadata?.subdomain || `${id}.${AGENTS_DOMAIN}`;
      res.json({
        id,
        status: runtime?.status || 'stopped',
        startedAt: runtime?.startedAt || metadata?.createdAt || new Date().toISOString(),
        plan: metadata?.plan || 'free',
        subdomain,
        url: `https://${subdomain}`,
        openclawVersion,
      });
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to fetch agent';
      res.status(500).json({ error: message });
    });
});

app.put('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Update agent
  res.json({ id, message: 'Agent updated' });
});

app.delete('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Delete agent
  res.json({ id, message: 'Agent deleted' });
});

// Deployments endpoint
app.post('/api/deployments', authenticate, async (req: Request, res: Response) => {
  const { agentId, config } = req.body as {
    agentId?: string;
    config?: {
      telegramToken?: string;
      ownerIds?: string[];
      aiProvider?: string;
      apiKey?: string;
      plan?: string;
    };
  };

  if (!agentId) {
    res.status(400).json({ error: 'agentId is required' });
    return;
  }

  const safeAgentId = sanitizeAgentId(agentId);
  if (!safeAgentId) {
    res.status(400).json({ error: 'Invalid agentId' });
    return;
  }

  if (!config?.telegramToken) {
    res.status(400).json({ error: 'telegramToken is required' });
    return;
  }

  const containerName = getContainerName(safeAgentId);

  try {
    await ensureDataDirs();

    const existing = await containerStatus(containerName);
    if (existing?.status === 'active') {
      const metadata = await readAgentMetadata(safeAgentId);
      const subdomain = metadata?.subdomain || `${safeAgentId}.${AGENTS_DOMAIN}`;
      res.status(200).json({
        id: `deploy-${safeAgentId}`,
        agentId: safeAgentId,
        subdomain,
        url: `https://${subdomain}`,
        status: 'active',
        openclawVersion: OPENCLAW_RUNTIME_VERSION,
      });
      return;
    }

    const openclawConfig = createOpenClawConfig(
      config.telegramToken,
      config.aiProvider || 'openrouter',
      config.apiKey,
      config.ownerIds,
    );

    const volumeName = `openclaw-data-${safeAgentId}`;
    await runCommand(`docker volume create ${volumeName}`);

    const configBase64 = Buffer.from(JSON.stringify(openclawConfig, null, 2), 'utf8').toString('base64');
    await runCommand([
      'docker run --rm',
      `-e OPENCLAW_CONFIG_B64='${configBase64}'`,
      `-v ${volumeName}:/target`,
      'alpine',
      `sh -lc "mkdir -p /target/agents /target/workspace /target/logs /target/canvas /target/cron && echo \"\\$OPENCLAW_CONFIG_B64\" | base64 -d > /target/openclaw.json && chmod -R 777 /target"`,
    ].join(' '));

    const ports = await readPorts();
    const assignedPort = ports[safeAgentId] || await getNextPort();

    try {
      await runCommand(`docker rm -f ${containerName}`);
    } catch {
      // no-op
    }

    await runCommand(
      [
        'docker run -d',
        `--name ${containerName}`,
        '--restart unless-stopped',
        `-v ${volumeName}:/home/node/.openclaw`,
        `-p ${assignedPort}:18789`,
        OPENCLAW_IMAGE,
      ].join(' '),
    );

    ports[safeAgentId] = assignedPort;
    await writePorts(ports);

    const subdomain = `${safeAgentId}.${AGENTS_DOMAIN}`;
    await writeAgentMetadata({
      agentId: safeAgentId,
      createdAt: new Date().toISOString(),
      plan: config.plan || 'free',
      aiProvider: config.aiProvider || 'openrouter',
      port: assignedPort,
      subdomain,
    });

    res.status(201).json({
      id: `deploy-${safeAgentId}`,
      agentId: safeAgentId,
      subdomain,
      url: `https://${subdomain}`,
      status: 'active',
      openclawVersion: OPENCLAW_RUNTIME_VERSION,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Deployment failed';
    res.status(500).json({ error: message });
  }
});

app.post('/api/agents/:id/start', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  try {
    await runCommand(`docker start ${containerName}`);
    res.json({ success: true, status: 'active' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Start failed';
    res.status(500).json({ error: message });
  }
});

app.post('/api/agents/:id/stop', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  try {
    await runCommand(`docker stop ${containerName}`);
    res.json({ success: true, status: 'stopped' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stop failed';
    res.status(500).json({ error: message });
  }
});

app.post('/api/agents/:id/restart', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  try {
    const healResult = await healLegacyModelInContainer(containerName);
    await runCommand(`docker restart ${containerName}`);
    const openclawVersion = await getContainerRuntimeVersion(containerName);
    res.json({ success: true, status: 'active', healedLegacyModel: healResult.healed, healMessage: healResult.message, openclawVersion });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Restart failed';
    res.status(500).json({ error: message });
  }
});

app.post('/api/agents/:id/update', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  const requestedImage = typeof req.body?.image === 'string' ? req.body.image.trim() : '';
  const targetImage = requestedImage || OPENCLAW_IMAGE;

  if (!isValidDockerImage(targetImage)) {
    res.status(400).json({ error: 'Invalid docker image value' });
    return;
  }

  try {
    const inspect = await getContainerInspect(containerName);
    const backupPath = await backupContainerData(containerName, inspect);
    const oldImage = inspect.Config.Image;

    await healLegacyModelInContainer(containerName);
    await runCommand(`docker pull ${targetImage}`);
    await runCommand(`docker stop ${containerName}`);
    await runCommand(`docker rm ${containerName}`);

    try {
      await recreateContainerWithImage(containerName, inspect, targetImage);
    } catch (e) {
      await runCommand(`docker rm -f ${containerName}`).catch(() => Promise.resolve());
      await recreateContainerWithImage(containerName, inspect, oldImage);
      throw e;
    }

    res.json({
      success: true,
      status: 'active',
      image: targetImage,
      previousImage: oldImage,
      backupPath,
      openclawVersion: OPENCLAW_RUNTIME_VERSION,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    res.status(500).json({ error: message });
  }
});

// Get agent gateway token
app.get('/api/agents/:id/token', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const metadata = await readAgentMetadata(id);
    if (!metadata) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    if (!metadata.gatewayToken) {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      metadata.gatewayToken = token;
      await writeAgentMetadata(metadata);
    }
    res.json({ token: metadata.gatewayToken });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get token';
    res.status(500).json({ error: message });
  }
});

// Repair agent - full reconfigure
app.post('/api/agents/:id/repair', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  try {
    const inspect = await getContainerInspect(containerName);
    const oldImage = inspect.Config.Image;
    
    await healLegacyModelInContainer(containerName);
    await runCommand(`docker stop ${containerName}`);
    await runCommand(`docker rm ${containerName}`);
    
    try {
      await recreateContainerWithImage(containerName, inspect, oldImage);
    } catch (e) {
      await recreateContainerWithImage(containerName, inspect, oldImage);
      throw e;
    }
    
    res.json({ success: true, message: 'Agent repaired successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Repair failed';
    res.status(500).json({ error: message });
  }
});

// Reset agent memory
app.post('/api/agents/:id/reset-memory', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  try {
    const mount = (await getContainerInspect(containerName)).Mounts.find((m) => m.Destination === '/home/node/.openclaw');
    if (!mount) {
      res.status(500).json({ error: 'Could not find data mount' });
      return;
    }
    
    if (mount.Type === 'volume' && mount.Name) {
      await runCommand(`docker exec ${containerName} sh -lc "rm -rf /home/node/.openclaw/agents/*/memory /home/node/.openclaw/agents/*/identity 2>/dev/null || true"`);
    } else if (mount.Type === 'bind' && mount.Source) {
      await runCommand(`rm -rf ${mount.Source}/agents/*/memory ${mount.Source}/agents/*/identity 2>/dev/null || true`);
    }
    
    await runCommand(`docker restart ${containerName}`);
    res.json({ success: true, message: 'Memory reset successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`🦞 Agentbot API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
