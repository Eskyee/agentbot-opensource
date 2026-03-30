import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { timingSafeEqual, randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Trust proxy — set to 1 (trust only the first proxy hop)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers
app.use((req, res, next) => {
  delete req.headers['x-original-url'];
  delete req.headers['x-rewrite-url'];
  delete req.headers['x-forwarded-host'];
  next();
});

app.use(express.json({ limit: '1mb' }));

// Structured request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = randomBytes(8).toString('hex');

  (req as any).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
    };
    if (res.statusCode >= 500) console.error(JSON.stringify(log));
    else if (res.statusCode >= 400) console.warn(JSON.stringify(log));
    else console.info(JSON.stringify(log));
  });

  next();
});

// CORS — use environment variable for allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

const deployLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Deployment rate limit exceeded.' },
});

app.use('/api/', generalLimiter);

const PORT = process.env.PORT || 3001;

// API key — refuse to start in production without it
if (!process.env.INTERNAL_API_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: INTERNAL_API_KEY must be set in production.');
    process.exit(1);
  }
  console.warn('WARNING: INTERNAL_API_KEY not set — dev fallback.');
}
const API_KEY = process.env.INTERNAL_API_KEY || 'dev-api-key-build-only';

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:latest';
const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'openrouter/openai/gpt-4o-mini';

// --- Docker helpers ---

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
  metadata?: Record<string, unknown>;
  gatewayToken?: string;
  config?: Record<string, unknown>;
  ownerEmail?: string;
};

const runCommand = (cmd: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Command failed with exit code ${code}`));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
    child.on('error', reject);
  });
};

// --- Port management ---

const PLAN_RESOURCES: Record<string, { memory: string; cpus: string }> = {
  solo: { memory: '2g', cpus: '1' },
  collective: { memory: '4g', cpus: '2' },
  label: { memory: '8g', cpus: '4' },
  network: { memory: '16g', cpus: '4' },
  starter: { memory: '2g', cpus: '1' },
  pro: { memory: '4g', cpus: '2' },
};

const getPlanResources = (plan: string) => PLAN_RESOURCES[plan] || PLAN_RESOURCES.starter;

const sanitizeAgentId = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');
const getContainerName = (agentId: string): string => `openclaw-${sanitizeAgentId(agentId)}`;
const agentFilePath = (agentId: string): string => path.join(DATA_DIR, 'agents', `${sanitizeAgentId(agentId)}.json`);
const portsFilePath = (): string => path.join(DATA_DIR, 'ports.json');
const lockFilePath = (): string => path.join(DATA_DIR, 'ports.lock');

const withLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const lockFile = lockFilePath();
  let retries = 50;
  while (retries > 0) {
    try {
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
  if (retries === 0) throw new Error('Could not acquire lock');
  try { return await fn(); }
  finally { try { await fs.unlink(lockFile); } catch { /* noop */ } }
};

const readPorts = async (): Promise<Record<string, number>> => {
  try { return JSON.parse(await fs.readFile(portsFilePath(), 'utf8')); }
  catch { return {}; }
};

const writePorts = async (ports: Record<string, number>): Promise<void> => {
  await fs.writeFile(portsFilePath(), JSON.stringify(ports, null, 2));
};

const getNextPortAndAssign = async (agentId: string): Promise<number> => {
  return withLock(async () => {
    const ports = await readPorts();
    if (ports[agentId]) return ports[agentId];
    const usedPorts = Object.values(ports);
    const allUsed = new Set([...usedPorts, ...usedPorts.map(p => p + 2)]);
    let port = BASE_PORT;
    while (allUsed.has(port) || allUsed.has(port + 2)) port++;
    ports[agentId] = port;
    await writePorts(ports);
    return port;
  });
};

const readAgentMetadata = async (agentId: string): Promise<AgentMetadata | null> => {
  try { return JSON.parse(await fs.readFile(agentFilePath(agentId), 'utf8')); }
  catch { return null; }
};

const writeAgentMetadata = async (agent: AgentMetadata): Promise<void> => {
  await fs.writeFile(agentFilePath(agent.agentId), JSON.stringify(agent, null, 2));
};

const ensureDataDirs = async (): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'instances'), { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'agents'), { recursive: true });
};

// --- Auth middleware ---

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

// --- Routes ---

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Import route handlers
import agentsRouter from './routes/agents';
import provisionRouter from './routes/provision';

app.use('/api/agents', authenticate, agentsRouter);
app.use('/api/provision', authenticate, provisionRouter);

// Deployments endpoint
app.post('/api/deployments', authenticate, deployLimiter, async (req: Request, res: Response) => {
  const { agentId, config } = req.body;

  if (!agentId) {
    res.status(400).json({ error: 'agentId is required' });
    return;
  }

  const safeAgentId = sanitizeAgentId(agentId);
  if (!safeAgentId) {
    res.status(400).json({ error: 'Invalid agentId' });
    return;
  }

  if (!config?.channelToken) {
    res.status(400).json({ error: 'channelToken is required' });
    return;
  }

  const containerName = getContainerName(safeAgentId);

  try {
    await ensureDataDirs();

    const assignedPort = await getNextPortAndAssign(safeAgentId);
    const subdomain = `${safeAgentId}.${AGENTS_DOMAIN}`;

    await writeAgentMetadata({
      agentId: safeAgentId,
      createdAt: new Date().toISOString(),
      plan: config.plan || 'starter',
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Deployment failed';
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Agentbot API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
