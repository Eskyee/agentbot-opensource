import express, { Request, Response } from 'express';
import inviteRouter from './invite';
import undergroundRouter from './underground';
import missionControlRouter from './mission-control';
import aiRouter from './routes/ai';
import renderMcpRouter from './routes/render-mcp';
import provisionRouter from './routes/provision';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { timingSafeEqual, randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import path from 'path';

dotenv.config();

// Deployment version: track app changes for cache busting
const DEPLOYMENT_VERSION = '2026.03.14.002';

const PLAN_RESOURCES: Record<string, { memory: string; cpus: string }> = {
  underground: { memory: '2g', cpus: '1' },
  collective: { memory: '4g', cpus: '2' },
  label: { memory: '8g', cpus: '4' },
  starter: { memory: '2g', cpus: '1' },
  pro: { memory: '4g', cpus: '2' },
  scale: { memory: '8g', cpus: '4' },
  enterprise: { memory: '16g', cpus: '4' },
  white_glove: { memory: '32g', cpus: '8' },
};

const getPlanResources = (plan: string) => {
  return PLAN_RESOURCES[plan] || PLAN_RESOURCES.starter;
};

const app = express();
const PORT = process.env.PORT || 3001;

// API key - MUST be set in production
const API_KEY = process.env.INTERNAL_API_KEY
if (!API_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('INTERNAL_API_KEY must be set in production')
}
const DEV_API_KEY = 'dev-api-key-build-only'
const ACTIVE_API_KEY = API_KEY || (process.env.NODE_ENV !== 'production' ? DEV_API_KEY : (() => { throw new Error('INTERNAL_API_KEY must be set'); })())

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:2026.3.13';
const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'google/gemini-2.0-flash';
const UPDATE_BACKUP_DIR = path.join(DATA_DIR, 'backups', 'openclaw-updates');
const OPENCLAW_RUNTIME_VERSION = '2026.3.13'
const DOCKER_IMAGE_REGEX = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?::[0-9]{2,5})?)\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[A-Fa-f0-9]{64})?$/;
const DOCKER_VOLUME_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts.' },
});

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://agentbot.com'],
  credentials: true,
}));
app.use(express.json());
app.use(globalLimiter);
app.use('/api/invite', inviteRouter);
app.use('/api/underground', undergroundRouter);
app.use('/api/mission-control', missionControlRouter);
app.use('/api/ai', aiRouter); // Universal AI provider routes (OpenRouter)
app.use('/api/render-mcp', renderMcpRouter); // Render MCP Server integration
app.use('/api/provision', provisionRouter); // BASEFM agent provisioning

type AgentMetadata = {
  agentId: string;
  createdAt: string;
  plan: string;
  aiProvider: string;
  port: number;
  subdomain: string;
  gatewayToken?: string;
  // Verification fields for Verified Human Badge
  verified?: boolean;
  verificationType?: string;
  attestationUid?: string;
  verifierAddress?: string;
  verifiedAt?: string;
  verificationMetadata?: Record<string, unknown>;
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

/**
 * Executes a command with arguments using child_process.spawn.
 * Mitigates shell injection by avoiding the shell entirely.
 */
const runCommand = (cmd: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Command failed with exit code ${code}`));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Helper to run complex shell commands (pipes, redirects) securely.
 * Still uses a shell but encapsulates the sh -c pattern.
 */
const runShellCommand = (shellCommand: string): Promise<{ stdout: string; stderr: string }> => {
  return runCommand('sh', ['-c', shellCommand]);
};

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
    // Using runCommand for security, but we still need sh inside the container
    const { stdout } = await runCommand('docker', [
      'exec', 
      containerName, 
      'sh', 
      '-lc', 
      `echo "${encoded}" | base64 -d > /tmp/heal-model.js && node /tmp/heal-model.js`
    ]);

    if (stdout.startsWith('healed:')) {
      return { healed: true, message: stdout };
    }
    return { healed: false, message: stdout || 'skip' };
  } catch {
    return { healed: false, message: 'skip:container-not-running' };
  }
};

const getContainerInspect = async (containerName: string): Promise<ContainerInspect> => {
  const { stdout } = await runCommand('docker', ['inspect', containerName]);
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

    // This command needs shell redirection (>)
    await runShellCommand(
      `docker run --rm -v ${mount.Name}:/data:ro alpine sh -lc 'tar czf - -C /data .' > "${backupFile}"`
    );
    return backupFile;
  }

  if (mount.Type === 'bind' && mount.Source) {
    return null;
  }

  return null;
};

const recreateContainerWithImage = async (containerName: string, inspect: ContainerInspect, image: string, plan: string = 'starter'): Promise<void> => {
  const portMapping = inspect.NetworkSettings.Ports['18789/tcp'];
  const hostPort = portMapping && portMapping[0]?.HostPort;
  if (!hostPort) {
    throw new Error('Could not determine host port');
  }

  const mount = inspect.Mounts.find((m) => m.Destination === '/home/node/.openclaw');
  if (!mount) {
    throw new Error('Could not determine data mount');
  }

  const mountType = mount.Type === 'volume' && mount.Name ? 'volume' : (mount.Type === 'bind' && mount.Source ? 'bind' : '');
  if (!mountType) {
    throw new Error('Unsupported mount configuration');
  }

  const mountSource = mountType === 'volume' ? mount.Name : mount.Source;
  const resources = getPlanResources(plan);
  
  const args: string[] = [
    'run', '-d',
    '--name', containerName,
    '--restart', 'unless-stopped',
    '-p', `${hostPort}:18789`,
    `--memory=${resources.memory}`,
    `--cpus=${resources.cpus}`,
    '-v', `${mountSource}:/home/node/.openclaw`,
    image
  ];

  await runCommand('docker', args);
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
    const { stdout } = await runCommand('docker', [
      'exec',
      containerName,
      'sh',
      '-lc',
      `echo "${encoded}" | base64 -d > /tmp/version.js && node /tmp/version.js`
    ]);
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
const lockFilePath = (): string => path.join(DATA_DIR, 'ports.lock');

/**
 * Executes a function while holding a file-based lock.
 * This ensures atomic access to ports.json across multiple provisioning requests.
 */
const withLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const lockFile = lockFilePath();
  let retries = 50; // Max 5 seconds (50 * 100ms)
  
  while (retries > 0) {
    try {
      // Try to create the lock file. 'wx' means it fails if it already exists.
      const handle = await fs.open(lockFile, 'wx');
      await handle.close();
      break;
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      throw err;
    }
  }

  if (retries === 0) {
    throw new Error('Could not acquire lock for ports.json after multiple retries');
  }

  try {
    return await fn();
  } finally {
    // Always remove the lock file, even if the function fails
    try {
      await fs.unlink(lockFile);
    } catch (err) {
      console.error('Failed to remove lock file:', err);
    }
  }
};

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

/**
 * Gets the next available port and updates the ports.json atomically.
 * Uses withLock to prevent race conditions during port assignment.
 */
const getNextPortAndAssign = async (agentId: string): Promise<number> => {
  return await withLock(async () => {
    const ports = await readPorts();
    
    // If agent already has a port, return it
    if (ports[agentId]) {
      return ports[agentId];
    }

    const usedPorts = Object.values(ports);
    // Account for port offset: each agent uses assignedPort and assignedPort + 2
    const allUsedPorts = new Set([
      ...usedPorts,
      ...usedPorts.map(p => p + 2)
    ]);
    
    // Find next available port accounting for offset
    let port = BASE_PORT;
    while (allUsedPorts.has(port) || allUsedPorts.has(port + 2)) port++;
    
    // Assign and save immediately while holding the lock
    ports[agentId] = port;
    await writePorts(ports);
    
    return port;
  });
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
    const { stdout } = await runCommand('docker', [
      'inspect', 
      containerName, 
      '--format', 
      '{{.State.Status}}|{{.State.StartedAt}}'
    ]);
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
  ownerIds?: string[],
): Record<string, unknown> => {
  let model = DEFAULT_MODEL;
  const provider = aiProvider || 'openrouter';

  if (provider === 'gemini' || provider === 'google') {
    model = 'google/gemini-2.0-flash';
  } else if (provider === 'groq') {
    model = 'groq/gemma2-9b-it';
  } else if (provider === 'anthropic') {
    model = 'anthropic/claude-sonnet-4-5';
  } else if (provider === 'openai') {
    model = 'openai/gpt-4o';
  } else if (provider === 'openrouter') {
    model = 'moonshotai/kimi-k2.5';
  } else {
    throw new Error(`Unsupported aiProvider: ${provider}`);
  }

  const config: Record<string, unknown> = {
    // Note: Secrets are now passed via Docker environment variables at runtime
    agents: {
      defaults: {
        model: { primary: model },
      },
    },
    channels: {
      telegram: {
        enabled: true,
        botToken: telegramToken,
        dmPolicy: 'pairing',
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

// Auth middleware — constant-time comparison to prevent timing attacks
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);

  if (!ACTIVE_API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // Constant-time comparison
  try {
    const tokenBuf = Buffer.from(token, 'utf8');
    const keyBuf = Buffer.from(ACTIVE_API_KEY, 'utf8');

    if (tokenBuf.length !== keyBuf.length || !timingSafeEqual(tokenBuf, keyBuf)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'demo',
    version: DEPLOYMENT_VERSION,
  });
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
    const { stdout } = await runCommand('docker', [
      'ps', 
      '--filter', 'name=openclaw-', 
      '--format', '{{.Names}}|{{.Image}}|{{.Status}}|{{.CreatedAt}}'
    ]);
    const lines = stdout ? stdout.split('\n').filter(Boolean) : [];
    const instances = await Promise.all(lines.map(async (line) => {
      const [name, image, status, createdAt] = line.split('|');
      const agentId = name.replace('openclaw-', '');
      const metadata = await readAgentMetadata(agentId);
      
      let containerVersion = 'unknown';
      try {
        const { stdout: versionOutput } = await runCommand('docker', [
          'exec', name, 'openclaw', '--version'
        ]);
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
    const { stdout: stats } = await runCommand('docker', [
      'stats', 
      containerName, 
      '--no-stream', 
      '--format', '{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}'
    ]);
    
    const { stdout: inspect } = await runCommand('docker', [
      'inspect', 
      containerName, 
      '--format', '{{.State.StartedAt}}|{{.State.Status}}'
    ]);
    
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
  runCommand('docker', [
    'ps', '-a', 
    '--filter', 'name=openclaw-', 
    '--format', '{{.Names}}|{{.Status}}'
  ])
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
  res.status(501).json({ error: 'Agent creation not yet implemented. Use /api/deployments instead.' });
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
        // Include verification status in response
        verified: metadata?.verified || false,
        verificationType: metadata?.verificationType || null,
        attestationUid: metadata?.attestationUid || null,
        verifiedAt: metadata?.verifiedAt || null,
      });
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to fetch agent';
      res.status(500).json({ error: message });
    });
});

app.put('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  res.status(501).json({ error: 'Agent update not yet implemented. Use /api/agents/:id/restart or /api/agents/:id/update instead.' });
});

app.delete('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  res.status(501).json({ error: 'Agent deletion not yet implemented.' });
});

// Agent verification endpoints for Verified Human Badge
app.get('/api/agents/:id/verification', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const metadata = await readAgentMetadata(id);
    if (!metadata) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json({
      verified: metadata.verified || false,
      verificationType: metadata.verificationType || null,
      attestationUid: metadata.attestationUid || null,
      verifierAddress: metadata.verifierAddress || null,
      verifiedAt: metadata.verifiedAt || null,
      metadata: metadata.verificationMetadata || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch verification status';
    res.status(500).json({ error: message });
  }
});

app.post('/api/agents/:id/verify', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { verificationType, verified, attestationUid, verifierAddress, metadata } = req.body;

  try {
    const existingMetadata = await readAgentMetadata(id);
    if (!existingMetadata) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Update verification fields
    existingMetadata.verified = verified;
    existingMetadata.verificationType = verificationType;
    existingMetadata.attestationUid = attestationUid;
    existingMetadata.verifierAddress = verifierAddress;
    existingMetadata.verifiedAt = verified ? new Date().toISOString() : undefined;
    existingMetadata.verificationMetadata = metadata;

    await writeAgentMetadata(existingMetadata);

    res.json({
      success: true,
      verified: existingMetadata.verified,
      verificationType: existingMetadata.verificationType,
      attestationUid: existingMetadata.attestationUid,
      verifiedAt: existingMetadata.verifiedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update verification';
    res.status(500).json({ error: message });
  }
});

app.delete('/api/agents/:id/verify', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingMetadata = await readAgentMetadata(id);
    if (!existingMetadata) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Remove verification fields
    existingMetadata.verified = false;
    existingMetadata.verificationType = undefined;
    existingMetadata.attestationUid = undefined;
    existingMetadata.verifierAddress = undefined;
    existingMetadata.verifiedAt = undefined;
    existingMetadata.verificationMetadata = undefined;

    await writeAgentMetadata(existingMetadata);

    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove verification';
    res.status(500).json({ error: message });
  }
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
      config.ownerIds,
    );

    const volumeName = `openclaw-data-${safeAgentId}`;
    await runCommand('docker', ['volume', 'create', volumeName]);

    const configBase64 = Buffer.from(JSON.stringify(openclawConfig, null, 2), 'utf8').toString('base64');
    // Using runShellCommand for the complex sequence with base64 decoding and pipes
    await runShellCommand(
      `docker run --rm -e OPENCLAW_CONFIG_B64='${configBase64}' -v ${volumeName}:/target alpine sh -lc "mkdir -p /target/agents /target/workspace /target/logs /target/canvas /target/cron && echo \\$OPENCLAW_CONFIG_B64 | base64 -d > /target/openclaw.json && chmod -R 777 /target"`
    );

    const assignedPort = await getNextPortAndAssign(safeAgentId);

    try {
      await runCommand('docker', ['rm', '-f', containerName]);
    } catch {
      // no-op
    }

    const provider = config.aiProvider || 'openrouter';
    const providedKey = (config.apiKey || '').trim();
    const envArgs: string[] = [];

    const addEnvIfKeyExists = (envName: string) => {
      const key = providedKey || (process.env[envName] || '').trim();
      if (key) {
        envArgs.push('-e', `${envName}=${key}`);
      }
    };

    if (provider === 'gemini' || provider === 'google') {
      addEnvIfKeyExists('GEMINI_API_KEY');
    } else if (provider === 'groq') {
      addEnvIfKeyExists('GROQ_API_KEY');
    } else if (provider === 'anthropic') {
      addEnvIfKeyExists('ANTHROPIC_API_KEY');
    } else if (provider === 'openai') {
      addEnvIfKeyExists('OPENAI_API_KEY');
    } else if (provider === 'openrouter') {
      addEnvIfKeyExists('OPENROUTER_API_KEY');
    }

    const resources = getPlanResources(config.plan || 'free');

    await runCommand('docker', [
      'run', '-d',
      '--name', containerName,
      '--restart', 'unless-stopped',
      '--memory', resources.memory,
      '--cpus', resources.cpus,
      ...envArgs,
      '-v', `${volumeName}:/home/node/.openclaw`,
      '-p', `${assignedPort}:18789`,
      '-p', `${assignedPort + 2}:18791`,
      OPENCLAW_IMAGE,
    ]);

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
    await runCommand('docker', ['start', containerName]);
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
    await runCommand('docker', ['stop', containerName]);
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
    await runCommand('docker', ['restart', containerName]);
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
    await runCommand('docker', ['pull', targetImage]);
    await runCommand('docker', ['stop', containerName]);
    await runCommand('docker', ['rm', containerName]);

    try {
      await recreateContainerWithImage(containerName, inspect, targetImage);
    } catch (e) {
      await runCommand('docker', ['rm', '-f', containerName]).catch(() => Promise.resolve());
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
      const token = randomBytes(32).toString('hex');
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
    await runCommand('docker', ['stop', containerName]);
    await runCommand('docker', ['rm', containerName]);
    
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
      // This command uses shell expansion (*)
      await runShellCommand(`docker exec ${containerName} sh -lc "rm -rf /home/node/.openclaw/agents/*/memory /home/node/.openclaw/agents/*/identity 2>/dev/null || true"`);
    } else if (mount.Type === 'bind' && mount.Source) {
      // This command uses shell expansion (*)
      await runShellCommand(`rm -rf "${mount.Source}"/agents/*/memory "${mount.Source}"/agents/*/identity 2>/dev/null || true`);
    }
    
    await runCommand('docker', ['restart', containerName]);
    res.json({ success: true, message: 'Memory reset successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    res.status(500).json({ error: message });
  }
});

const OPENCLAW_REPO = 'OpenClaw/openclaw';
const AUTO_UPDATE_INTERVAL = process.env.AUTO_UPDATE_INTERVAL || '0 3 * * *';

async function checkForOpenClawUpdate(): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${OPENCLAW_REPO}/releases/latest`, {
      headers: { 'User-Agent': 'Agentbot' }
    });
    if (!response.ok) return null;
    
    const release = await response.json() as { tag_name?: string; name?: string };
    const latestVersion = release.tag_name?.replace(/^v/, '') || release.name?.replace(/^v/, '');
    
    if (latestVersion && latestVersion !== OPENCLAW_RUNTIME_VERSION) {
      console.log(`[Auto-Update] New OpenClaw version available: ${latestVersion} (current: ${OPENCLAW_RUNTIME_VERSION})`);
      return latestVersion;
    }
    
    return null;
  } catch (error) {
    console.error('[Auto-Update] Failed to check for updates:', error);
    return null;
  }
}

async function updateAllContainers(newVersion: string): Promise<{ success: number; failed: number }> {
  const portsFileContent = await fs.readFile(portsFilePath(), 'utf8').catch(() => '{}');
  const ports = JSON.parse(portsFileContent) as Record<string, number>;
  const results = { success: 0, failed: 0 };
  const newImage = `ghcr.io/openclaw/openclaw:${newVersion}`;
  
  for (const agentId of Object.keys(ports)) {
    const containerName = getContainerName(agentId);
    try {
      console.log(`[Auto-Update] Updating ${agentId} to ${newVersion}...`);
      await runCommand('docker', ['pull', newImage]);
      await runCommand('docker', ['stop', containerName]);
      await runCommand('docker', ['rm', containerName]);
      
      const port = await getNextPortAndAssign(agentId);
      
      await runCommand('docker', [
        'run', '-d',
        '--name', containerName,
        '--restart', 'unless-stopped',
        '-v', `agentbot-${agentId}:/home/node/.openclaw`,
        '-p', `${port}:18789`,
        newImage,
      ]);
      
      results.success++;
    } catch (error) {
      console.error(`[Auto-Update] Failed to update ${agentId}:`, error);
      results.failed++;
    }
  }
  
  return results;
}

function startAutoUpdater() {
  console.log(`[Auto-Update] Scheduler initialized (${AUTO_UPDATE_INTERVAL})`);
  
  const checkAndUpdate = async () => {
    console.log('[Auto-Update] Checking for OpenClaw updates...');
    const latestVersion = await checkForOpenClawUpdate();
    
    if (latestVersion) {
      console.log(`[Auto-Update] Updating all containers to v${latestVersion}...`);
      const results = await updateAllContainers(latestVersion);
      console.log(`[Auto-Update] Update complete: ${results.success} succeeded, ${results.failed} failed`);
    } else {
      console.log('[Auto-Update] Already running latest version');
    }
  };
  
  const [hour, minute] = (process.env.AUTO_UPDATE_TIME || '03:00').split(':').map(Number);
  const intervalMs = 24 * 60 * 60 * 1000;
  
  setInterval(checkAndUpdate, intervalMs);
  
  setTimeout(checkAndUpdate, 5000);
  
  console.log('[Auto-Update] Auto-updater started');
}

app.listen(PORT, () => {
  console.log(`🦞 Agentbot API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('Routes: /health, /api/render-mcp/*, /api/ai/*, /api/agents/*, /api/deployments');
  if (process.env.NODE_ENV === 'production') {
    startAutoUpdater();
  }
});

export default app;
// Cache bust 1773437272
