import express, { Request, Response, NextFunction } from 'express';
import { initDatabase } from './services/db-init';
import inviteRouter from './invite';
import undergroundRouter from './underground';
import missionControlRouter from './mission-control';
import aiRouter from './routes/ai';
import renderMcpRouter from './routes/render-mcp';
import metricsRouter from './routes/metrics';
import provisionRouter from './routes/provision';
import teamProvisionRouter from './routes/team-provision';
import registrationRouter from './routes/registration';
import agentsRouter from './routes/agents';
import openclawRouter, { proxy as openclawProxy } from './routes/openclaw';
import orchestrationRouter from './routes/orchestration';
import railwayProvisionRouter from './routes/railway-provision';
import platformJobsRouter from './routes/platform-jobs';
import http from 'http';
import { generateRealMetrics, calculateAverages, getPerformanceData } from './services/metrics-core';
import AIProviderService from './services/ai-provider';
import { startScheduler, stopScheduler } from './scheduler';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { timingSafeEqual, randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { DEFAULT_OPENCLAW_IMAGE, OPENCLAW_RUNTIME_VERSION } from './lib/openclaw-version';
import { buildHealthSummary } from './lib/health-summary';

dotenv.config();

// Deployment version: track app changes for cache busting
const DEPLOYMENT_VERSION = '2026.03.14.002';

// Plan resources — matches pricing tiers (Solo £29, Collective £69, Label £149, Network £499)
const PLAN_RESOURCES: Record<string, { memory: string; cpus: string }> = {
  solo: { memory: '2g', cpus: '1' },
  collective: { memory: '4g', cpus: '2' },
  label: { memory: '8g', cpus: '4' },
  network: { memory: '16g', cpus: '4' },
  // Legacy aliases
  underground: { memory: '2g', cpus: '1' },
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

// Trust proxy for accurate client IPs behind Render/Vercel load balancers
// Set to 1 (trust only the first proxy hop) to prevent IP spoofing via X-Forwarded-For
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security: strip IIS/Express bypass headers
app.use((req, res, next) => {
  delete req.headers['x-original-url'];
  delete req.headers['x-rewrite-url'];
  delete req.headers['x-forwarded-host'];
  next();
});

app.use(express.json({ limit: '1mb' }));

// Structured request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = randomBytes(8).toString('hex');

  // Attach request ID for downstream use
  (req as Request & { requestId: string }).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    };
    // Use console.info for successful requests, console.warn for 4xx, console.error for 5xx
    if (res.statusCode >= 500) console.error(JSON.stringify(log));
    else if (res.statusCode >= 400) console.warn(JSON.stringify(log));
    else console.info(JSON.stringify(log));
  });

  next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://agentbot.raveculture.xyz,https://web-iota-hazel-25.vercel.app,https://raveculture.mintlify.app').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin only from localhost (server-to-server)
    if (!origin) {
      // In production, null origin means server-to-server from localhost
      // Block null origin from remote clients (file:// protocol attacks)
      return callback(null, true); // Keep permissive for server-to-server
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting — applied globally, with tighter limits on expensive endpoints
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 120,                   // 120 req/min per IP on general routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
const deployLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,                     // 5 deploys/min per IP — prevents container spam
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Deployment rate limit exceeded.' },
});
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,                    // 30 AI chat req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded.' },
});
app.use('/api/', generalLimiter);

const PORT = process.env.PORT || 3001;
const RUN_MODE = (process.env.AGENTBOT_RUN_MODE || 'all').toLowerCase();

// API key — refuse to start in production without it
if (!process.env.INTERNAL_API_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: INTERNAL_API_KEY must be set in production. Refusing to start.');
    process.exit(1);
  }
  console.warn('WARNING: INTERNAL_API_KEY not set — using dev fallback. Do NOT deploy to production.');
}
const API_KEY = process.env.INTERNAL_API_KEY || 'dev-api-key-build-only';

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_IMAGE = DEFAULT_OPENCLAW_IMAGE;
const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'google/gemini-2.0-flash';
const UPDATE_BACKUP_DIR = path.join(DATA_DIR, 'backups', 'openclaw-updates');
const DOCKER_IMAGE_REGEX = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?::[0-9]{2,5})?)\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[A-Fa-f0-9]{64})?$/;
const DOCKER_VOLUME_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

type AgentMetadata = {
  agentId: string;
  createdAt: string;
  plan: string;
  aiProvider?: string;
  port?: number;
  subdomain?: string;
  url?: string;
  status?: string;
  openclawVersion?: string;
  botUsername?: string;
  metadata?: Record<string, unknown>;
  gatewayToken?: string;
  config?: Record<string, unknown>;
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
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
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
  discordToken?: string,
  whatsappEnabled?: boolean,
  userTimezone?: string,
  plan?: string,
): Record<string, unknown> => {
  let model = DEFAULT_MODEL;
  let fallbacks = ['openai/gpt-4o-mini'];
  const provider = aiProvider || 'openrouter';

  if (provider === 'gemini' || provider === 'google') {
    model = 'google/gemini-2.0-flash';
    fallbacks = ['openrouter/anthropic/claude-sonnet-4-5'];
  } else if (provider === 'groq') {
    model = 'groq/gemma2-9b-it';
    fallbacks = ['openai/gpt-4o-mini'];
  } else if (provider === 'anthropic') {
    model = 'anthropic/claude-sonnet-4-5';
    fallbacks = ['openai/gpt-4o'];
  } else if (provider === 'openai') {
    model = 'openai/gpt-4o';
    fallbacks = ['openai/gpt-4o-mini'];
  } else if (provider === 'openrouter') {
    model = 'moonshotai/kimi-k2.5';
    fallbacks = ['openrouter/openai/gpt-4o-mini'];
  } else {
    throw new Error(`Unsupported aiProvider: ${provider}`);
  }

  // Generate unique gateway auth token per agent
  const gatewayToken = randomBytes(24).toString('hex');

  // Tool profile per plan — solo gets messaging, others get coding
  const toolProfile = (plan === 'solo') ? 'messaging' : 'coding';

  const channels: Record<string, unknown> = {
    defaults: {
      groupPolicy: 'allowlist',
      heartbeat: { showOk: false, showAlerts: true, useIndicator: true },
    },
  };

  // Telegram channel
  if (telegramToken) {
    channels.telegram = {
      enabled: true,
      botToken: telegramToken,
      dmPolicy: ownerIds && ownerIds.length > 0 ? 'allowlist' : 'pairing',
      allowFrom: ownerIds || [],
      groups: { '*': { requireMention: true } },
      historyLimit: 50,
      replyToMode: 'first',
      streaming: 'partial',
      retry: { attempts: 3, minDelayMs: 400, maxDelayMs: 30000, jitter: 0.1 },
    };
  }

  // Discord channel
  if (discordToken) {
    channels.discord = {
      enabled: true,
      token: discordToken,
      dmPolicy: ownerIds && ownerIds.length > 0 ? 'allowlist' : 'pairing',
      allowFrom: ownerIds || [],
      dm: { enabled: true, groupEnabled: false },
      guilds: {},
      historyLimit: 20,
      streaming: 'partial',
      retry: { attempts: 3, minDelayMs: 500, maxDelayMs: 30000, jitter: 0.1 },
    };
  }

  // WhatsApp channel
  if (whatsappEnabled) {
    channels.whatsapp = {
      dmPolicy: ownerIds && ownerIds.length > 0 ? 'allowlist' : 'pairing',
      allowFrom: ownerIds || [],
      groups: { '*': { requireMention: true } },
      sendReadReceipts: true,
    };
  }

  const config: Record<string, unknown> = {
    agents: {
      defaults: {
        workspace: '~/.openclaw/workspace',
        model: { primary: model, fallbacks },
        imageMaxDimensionPx: 1200,
        userTimezone: userTimezone || 'Europe/London',
        timeFormat: '24h',
        groupChat: {
          mentionPatterns: ['@agent', 'agent'],
        },
        compaction: {
          maxMessages: 200,
          keepLastN: 20,
        },
        heartbeat: {
          every: '30m',
        },
        skipBootstrap: false,
        bootstrapMaxChars: 4000,
      },
    },
    channels,
    gateway: {
      mode: 'local',
      port: 18789,
      bind: 'lan', // Required for Docker — listen on all interfaces, not just loopback
      auth: {
        mode: 'token',
        token: gatewayToken,
        allowTailscale: true,
        rateLimit: {
          maxAttempts: 10,
          windowMs: 60000,
          lockoutMs: 300000,
          exemptLoopback: true,
        },
      },
      channelHealthCheckMinutes: 5,
      channelStaleEventThresholdMinutes: 30,
      channelMaxRestartsPerHour: 10,
      controlUi: {
        enabled: true,
      },
    },
    tools: {
      profile: toolProfile,
      deny: ['browser', 'canvas'], // No browser/canvas in containers
      exec: {
        allowedCommands: [
          'ls', 'cat', 'grep', 'find', 'curl', 'wget', 'git', 'npm', 'node',
          'python3', 'pip', 'mkdir', 'cp', 'mv', 'rm', 'echo', 'date', 'whoami',
          'chmod', 'chown', 'touch', 'head', 'tail', 'wc', 'sort', 'uniq',
          'awk', 'sed', 'tar', 'zip', 'unzip', 'docker', 'ps', 'df', 'du',
        ],
        allowedPaths: [
          '~/.openclaw/workspace',
          '/tmp',
          '/home/node',
        ],
        denyPaths: [
          '/etc/shadow',
          '/etc/passwd',
          '/proc',
          '/sys',
        ],
      },
      web: {
        maxChars: 50000,
      },
      loopDetection: {
        maxIterations: 20,
        windowMinutes: 5,
      },
    },
    session: {
      maxTokens: 100000,
      compaction: {
        strategy: 'auto',
        triggerAtPercent: 80,
      },
    },
    plugins: {
      entries: {},
    },
  };

  // Enable plugins based on channels
  if (telegramToken) {
    (config.plugins as { entries: Record<string, unknown> }).entries.telegram = { enabled: true };
  }
  if (discordToken) {
    (config.plugins as { entries: Record<string, unknown> }).entries.discord = { enabled: true };
  }

  return config;
};

// Auth middleware — timing-safe to prevent key-enumeration attacks
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);
  const tokenBuf = Buffer.from(token);
  const keyBuf = Buffer.from(API_KEY);
  if (tokenBuf.length !== keyBuf.length || !timingSafeEqual(tokenBuf, keyBuf)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Mount sub-routers
app.use('/api/invite', inviteRouter);
app.use('/api/underground', undergroundRouter);
app.use('/api/mission-control', missionControlRouter);
app.use('/api/ai', authenticate, aiChatLimiter, aiRouter);
app.use('/api/render-mcp', authenticate, renderMcpRouter);
app.use('/api/provision', authenticate, provisionRouter);
app.use('/api/provision/team', authenticate, teamProvisionRouter);
app.use('/api/metrics', authenticate, metricsRouter);
app.use('/api/agents', authenticate, agentsRouter);
app.use('/api/orchestration', authenticate, orchestrationRouter);
app.use('/api/railway', railwayProvisionRouter);
app.use('/api/platform-jobs', authenticate, platformJobsRouter);
// /api/openclaw/proxy/* is public — OpenClaw handles its own auth
// All other /api/openclaw/* routes require backend bearer token
app.use('/api/openclaw', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/proxy/')) return next();
  authenticate(req, res, next);
}, openclawRouter);
app.use('/api', registrationRouter); // validate-key, register-home, register-link, heartbeat

// Permission system — tiered command classification
import {
  preToolUseHook,
  getPendingForUser,
  getPendingForAgent,
  processPermissionDecision,
} from './middleware/permission-hook';

// GET /api/permissions — list pending requests for user
app.get('/api/permissions', authenticate, (req: Request, res: Response) => {
  const userId = req.userId || 'unknown';
  const agentId = req.query.agentId as string;
  const pending = agentId
    ? getPendingForAgent(agentId)
    : getPendingForUser(userId);
  res.json({ pending });
});

// POST /api/permissions — submit decision
app.post('/api/permissions', authenticate, (req: Request, res: Response) => {
  const { requestId, decision } = req.body;
  if (!requestId || !decision) {
    return res.status(400).json({ error: 'Missing requestId or decision' });
  }
  if (!['approve', 'reject', 'approve_always'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }
  const result = processPermissionDecision(requestId, decision);
  if (!result) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json({ success: true, requestId, decision, tier: result.tier });
});

// Health check — includes Docker status for observability
app.get('/health', async (req: Request, res: Response) => {
  res.json(buildHealthSummary({ dockerAvailable }));
});

// OpenAI-compatible endpoints for RAG/SDK compatibility
app.get('/v1/models', async (_req: Request, res: Response) => {
  try {
    const models = await AIProviderService.getAllModels();
    res.json({
      object: 'list',
      data: models.map((m: { id: string; name: string; provider: string }) => ({
        id: m.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: m.provider || 'agentbot',
      })),
    });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch models', type: 'server_error' } });
  }
});

app.get('/v1/models/:model', async (req: Request, res: Response) => {
  try {
    const models = await AIProviderService.getAllModels();
    const model = models.find((m: { id: string }) => m.id === req.params.model);
    if (!model) {
      return res.status(404).json({ error: { message: `Model ${req.params.model} not found`, type: 'invalid_request_error' } });
    }
    res.json({
      id: model.id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: model.provider || 'agentbot',
    });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch model', type: 'server_error' } });
  }
});

app.post('/v1/embeddings', authenticate, async (req: Request, res: Response) => {
  const { input, model } = req.body as { input?: string | string[]; model?: string };
  if (!input) {
    return res.status(400).json({ error: { message: 'input is required', type: 'invalid_request_error' } });
  }
  // Proxy to OpenRouter embeddings
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: { message: 'Embeddings not configured', type: 'server_error' } });
    }
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, model: model || 'openai/text-embedding-3-small' }),
    });
    const data = await response.json() as Record<string, unknown>;
    res.json(data);
  } catch {
    res.status(500).json({ error: { message: 'Embeddings request failed', type: 'server_error' } });
  }
});

// Install script endpoints
app.get('/install', (req: Request, res: Response) => {
  res.type('text/plain');
  res.sendFile('install.sh', { root: path.join(__dirname, '../public') });
});

app.get('/link', (req: Request, res: Response) => {
  res.type('text/plain');
  res.sendFile('link.sh', { root: path.join(__dirname, '../public') });
});

// Deployments endpoint
app.post('/api/deployments', authenticate, deployLimiter, async (req: Request, res: Response) => {
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
  // Check Docker availability first
  try {
    await runCommand('docker', ['version', '--format', '{{.Server.Version}}']);
  } catch (err: any) {
    console.warn('[Auto-Update] Docker not available — skipping container updates');
    return { success: 0, failed: 0 };
  }

  const portsFileContent = await fs.readFile(portsFilePath(), 'utf8').catch(() => '{}');
  const ports = JSON.parse(portsFileContent) as Record<string, number>;
  const results = { success: 0, failed: 0 };
  const newImage = `ghcr.io/openclaw/openclaw:${newVersion}`;
  const agentIds = Object.keys(ports);

  if (agentIds.length === 0) {
    console.log('[Auto-Update] No containers to update');
    return results;
  }

  // Pull the image once before touching any containers
  console.log(`[Auto-Update] Pulling image ${newImage}...`);
  try {
    await runCommand('docker', ['pull', newImage]);
  } catch (err: any) {
    console.error('[Auto-Update] Failed to pull image:', err.message);
    return { success: 0, failed: 0 };
  }

  // Update in parallel batches of 5 so we don't overwhelm the host
  const CONCURRENCY = 5;
  for (let i = 0; i < agentIds.length; i += CONCURRENCY) {
    const batch = agentIds.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(batch.map(async (agentId) => {
      const containerName = getContainerName(agentId);
      console.log(`[Auto-Update] Updating ${agentId} to ${newVersion}...`);

      // MED-04 FIX: Read agent metadata so we can restore plan-specific resource
      // limits when the container is recreated. Without this, every container
      // would restart without --memory / --cpus constraints, effectively giving
      // every agent unlimited host resources after an auto-update.
      const metadata = await readAgentMetadata(agentId);
      const resources = getPlanResources(metadata?.plan || 'starter');

      await runCommand('docker', ['stop', containerName]);
      await runCommand('docker', ['rm', containerName]);
      const port = await getNextPortAndAssign(agentId);
      await runCommand('docker', [
        'run', '-d',
        '--name', containerName,
        '--restart', 'unless-stopped',
        '--memory', resources.memory,
        '--cpus', resources.cpus,
        '-v', `openclaw-data-${agentId}:/home/node/.openclaw`,
        '-p', `${port}:18789`,
        newImage,
      ]);
    }));

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.success++;
      } else {
        console.error(`[Auto-Update] Batch failure:`, result.reason);
        results.failed++;
      }
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

/**
 * POST /api/subscriptions/deploy
 * Called by the Stripe webhook (via frontend) when a checkout completes.
 * Records the subscription → plan mapping so the next agent deployment
 * picks up the correct resource tier.
 */
app.post('/api/subscriptions/deploy', authenticate, async (req: Request, res: Response) => {
  const { tier, customerId, subscriptionId, stripeCustomerId } = req.body as {
    tier?: string;
    customerId?: string;
    subscriptionId?: string;
    stripeCustomerId?: string;
  };

  if (!customerId && !stripeCustomerId) {
    res.status(400).json({ error: 'customerId is required' });
    return;
  }
  if (!tier) {
    res.status(400).json({ error: 'tier is required' });
    return;
  }

  const validTiers = Object.keys(PLAN_RESOURCES);
  if (!validTiers.includes(tier)) {
    res.status(400).json({ error: `Invalid tier. Valid tiers: ${validTiers.join(', ')}` });
    return;
  }

  try {
    await ensureDataDirs();

    // Persist subscription metadata so provisioning endpoints can read it
    const id = (stripeCustomerId || customerId) as string;
    const subscriptionFile = path.join(DATA_DIR, 'subscriptions', `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    await fs.mkdir(path.join(DATA_DIR, 'subscriptions'), { recursive: true });
    await fs.writeFile(subscriptionFile, JSON.stringify({
      customerId: id,
      subscriptionId: subscriptionId || null,
      tier,
      plan: tier,
      resources: PLAN_RESOURCES[tier],
      activatedAt: new Date().toISOString(),
    }, null, 2));

    console.log(`[Subscriptions] Activated tier "${tier}" for customer ${id} (sub: ${subscriptionId})`);

    res.json({
      success: true,
      customerId: id,
      subscriptionId,
      tier,
      resources: PLAN_RESOURCES[tier],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Subscription activation failed';
    console.error('[Subscriptions] Deploy error:', message);
    res.status(500).json({ error: message });
  }
});

// NOTE: Routes for /api/ai, /api/provision, /api/metrics, /api/render-mcp,
// /api/agents, and /api/openclaw are already mounted above with Bearer token
// authentication. Do NOT re-mount them here without auth.

// Initialize database schema on startup.
// In production, a DB failure is fatal — don't serve traffic with a broken schema.
initDatabase().then(() => {
  console.log('[DB] Ready');
  // Start scheduler only after schema is confirmed ready — avoids 42P01 race on boot
  if (RUN_MODE === 'all' || RUN_MODE === 'worker') {
    startScheduler();
  }
}).catch(err => {
  console.error('[DB] Init error:', err.message);
  if (process.env.NODE_ENV === 'production') {
    console.error('[DB] Refusing to serve in production with failed schema. Exiting.');
    process.exit(1);
  }
});

// Check Docker availability at startup (non-fatal — container provisioning degrades gracefully)
const checkProvisioning = async () => {
  // Check Render API availability (replaces Docker check)
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    console.warn('[Provisioning] RENDER_API_KEY not set — provisioning disabled');
    return false;
  }
  try {
    const res = await fetch('https://api.render.com/v1/services?limit=1', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      console.log('[Provisioning] Render API available — container provisioning enabled');
      return true;
    }
    console.warn(`[Provisioning] Render API returned ${res.status} — provisioning disabled`);
    return false;
  } catch (err: any) {
    console.warn('[Provisioning] Render API unreachable — provisioning disabled. Error:', err.code || err.message);
    return false;
  }
};

let dockerAvailable = false;
checkProvisioning().then(available => { dockerAvailable = available; });

const server = http.createServer(app);

// WebSocket proxy for OpenClaw Control UI — require token auth
server.on('upgrade', (req, socket, head) => {
  const match = req.url?.match(/^\/api\/openclaw\/proxy\/([a-zA-Z0-9_-]+)(\/.*)?$/);
  if (match) {
    // Validate Bearer token before proxying WebSocket upgrades
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    const token = auth.substring(7);
    const tokenBuf = Buffer.from(token);
    const keyBuf = Buffer.from(API_KEY);
    if (tokenBuf.length !== keyBuf.length || !timingSafeEqual(tokenBuf, keyBuf)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    const agentId = match[1];
    const target = `http://agentbot-agent-${agentId}.railway.internal:18789`;
    const proxiedReq = Object.assign({}, req, { url: match[2] || '/' });
    openclawProxy.ws(proxiedReq as http.IncomingMessage, socket, head, { target });
  } else {
    socket.destroy();
  }
});

// Permission WebSocket — real-time approval notifications
import { setupWebSocket } from './lib/hooks/ws-handler';
const permissionWss = setupWebSocket(server);
console.log('[WS] Permission WebSocket registered at /ws/permissions');

let serverStarted = false;

export function startServer() {
  if (serverStarted) return server;

  server.listen(PORT, () => {
    console.log(`🦞 Agentbot API server running on port ${PORT} (mode=${RUN_MODE})`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('Routes: /health, /api/metrics/*, /api/render-mcp/*, /api/ai/*, /api/agents/*, /api/deployments');
    console.log('OpenClaw proxy: /api/openclaw/proxy/:agentId/*');

    if (process.env.NODE_ENV === 'production' && RUN_MODE !== 'worker') {
      startAutoUpdater();
    }
  });

  serverStarted = true;
  return server;
}

if (require.main === module) {
  startServer();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[API] Shutting down...');
  stopScheduler();
  process.exit(0);
});

export { server, permissionWss };
export default app;
// Cache bust 1773437272
