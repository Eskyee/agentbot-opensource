import './lib/sentry';
import { log } from './lib/logger';
import express, { Request, Response, NextFunction } from 'express';
import { initDatabase } from './services/db-init';
import inviteRouter from './invite';
import undergroundRouter from './underground';
import missionControlRouter from './mission-control';
import aiRouter from './routes/ai';
import metricsRouter from './routes/metrics';
import provisionRouter from './routes/provision';
import teamProvisionRouter from './routes/team-provision';
import registrationRouter from './routes/registration';
import agentsRouter from './routes/agents';
import openclawRouter, { proxy as openclawProxy } from './routes/openclaw';
import openclaudeRouter from './routes/openclaude';
import orchestrationRouter from './routes/orchestration';
import railwayProvisionRouter from './routes/railway-provision';
import platformJobsRouter from './routes/platform-jobs';
import cronRouter from './routes/cron';
import deploymentsRouter from './routes/deployments';
import subscriptionsRouter from './routes/subscriptions';
import http from 'http';
import { startScheduler, stopScheduler } from './scheduler';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomBytes, timingSafeEqual } from 'crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { buildHealthSummary } from './lib/health-summary';
import { getPoolStats } from './lib/db';
import { signatureGuard } from './middleware/signature';
import { authenticate } from './middleware/authenticate';
import openaiCompatRouter from './routes/openai-compat';
import { startAutoUpdater } from './lib/auto-update';

dotenv.config();

const PORT = process.env.PORT || 3001;
const RUN_MODE = (process.env.AGENTBOT_RUN_MODE || 'all').toLowerCase();
const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const OPENCLAW_HOME_DIR = '/root/.openclaw';

if (!process.env.INTERNAL_API_KEY) {
  log.error('FATAL: INTERNAL_API_KEY must be set. Refusing to start.');
  process.exit(1);
}
const API_KEY = process.env.INTERNAL_API_KEY;

export const PLAN_RESOURCES: Record<string, { memory: string; cpus: string }> = {
  solo: { memory: '2g', cpus: '1' },
  collective: { memory: '4g', cpus: '2' },
  label: { memory: '8g', cpus: '4' },
  network: { memory: '16g', cpus: '4' },
  underground: { memory: '2g', cpus: '1' },
  starter: { memory: '2g', cpus: '1' },
  pro: { memory: '4g', cpus: '2' },
  scale: { memory: '8g', cpus: '4' },
  enterprise: { memory: '16g', cpus: '4' },
  white_glove: { memory: '32g', cpus: '8' },
};

export const getPlanResources = (plan: string) => PLAN_RESOURCES[plan] || PLAN_RESOURCES.starter;

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  delete req.headers['x-original-url'];
  delete req.headers['x-rewrite-url'];
  delete req.headers['x-forwarded-host'];
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(signatureGuard);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = randomBytes(8).toString('hex');
  req.requestId = requestId;
  res.on('finish', () => {
    const duration = Date.now() - start;
    const entry = { requestId, method: req.method, path: req.originalUrl || req.url, status: res.statusCode, durationMs: duration };
    if (res.statusCode >= 500) log.error('request', { error: entry })
    else if (res.statusCode >= 400) log.warn('request', { error: entry })
    else log.info('request', { details: entry })
  });
  next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://agentbot.sh,https://web-iota-hazel-25.vercel.app,https://raveculture.mintlify.app').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      return callback(new Error('Null origin not permitted'));
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

const generalLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests' }, keyGenerator: (req) => ipKeyGenerator(req.ip || '0.0.0.0') });
const deployLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Deployment rate limit exceeded' }, keyGenerator: (req) => ipKeyGenerator(req.ip || '0.0.0.0') });
const aiChatLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'AI rate limit exceeded' }, keyGenerator: (req) => ipKeyGenerator(req.ip || '0.0.0.0') });
app.use('/api/', generalLimiter);

// Mount routes
app.use('/api/invite', inviteRouter);
app.use('/api/underground', undergroundRouter);
app.use('/api/mission-control', missionControlRouter);
app.use('/api/ai', authenticate, aiChatLimiter, aiRouter);
app.use('/api/provision', authenticate, provisionRouter);
app.use('/api/provision/team', authenticate, teamProvisionRouter);
app.use('/api/metrics', authenticate, metricsRouter);
app.use('/api/agents', authenticate, agentsRouter);
app.use('/api/orchestration', authenticate, orchestrationRouter);
app.use('/api/railway', railwayProvisionRouter);
app.use('/api/platform-jobs', authenticate, platformJobsRouter);
app.use('/api/cron', cronRouter);
app.use('/api/openclaude', authenticate, aiChatLimiter, openclaudeRouter);
app.use('/api/openclaw', authenticate, openclawRouter);
app.use('/api', registrationRouter);
app.use('/api/deployments', deploymentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use(openaiCompatRouter);

import { preToolUseHook, getPendingForUser, getPendingForAgent, processPermissionDecision } from './middleware/permission-hook';
app.get('/api/permissions', authenticate, async (req: Request, res: Response) => {
  const userId = req.userId || 'unknown';
  const agentId = req.query.agentId as string;
  const pending = agentId ? await getPendingForAgent(agentId) : await getPendingForUser(userId);
  res.json({ pending });
});
app.post('/api/permissions', authenticate, async (req: Request, res: Response) => {
  const { requestId, decision } = req.body;
  if (!requestId || !decision) return res.status(400).json({ error: 'Missing requestId or decision' });
  if (!['approve', 'reject', 'approve_always'].includes(decision)) return res.status(400).json({ error: 'Invalid decision' });
  const result = await processPermissionDecision(requestId, decision, req.userEmail);
  if (!result) return res.status(404).json({ error: 'Request not found' });
  res.json({ success: true, requestId, decision, tier: result.tier });
});

app.get('/health', async (req: Request, res: Response) => {
  const summary = buildHealthSummary({ dockerAvailable });
  res.json({ ...summary, provisioningChecked, db: getPoolStats() });
});

app.get('/install', (req: Request, res: Response) => { res.type('text/plain'); res.sendFile('install.sh', { root: require('path').join(__dirname, '../public') }); });
app.get('/link', (req: Request, res: Response) => { res.type('text/plain'); res.sendFile('link.sh', { root: require('path').join(__dirname, '../public') }); });

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.requestId;
  log.error('[Unhandled Error]', { error: { requestId: requestId ?? '-', message: err.message, stack: err.stack } })
  try { const { Sentry } = require('./lib/sentry'); Sentry.captureException(err, { extra: { requestId, path: req.path, method: req.method } }); } catch { /* Sentry not available */ }
  res.status(500).json({ error: 'Internal server error', requestId });
});

// Boot
initDatabase().then(() => {
  log.info('[DB] Ready');
  if (RUN_MODE === 'all' || RUN_MODE === 'worker') startScheduler();
}).catch(err => {
  log.error('[DB] Init error', { error: { message: err.message } })
  if (process.env.NODE_ENV === 'production') { log.error('[DB] Refusing to serve. Exiting.'); process.exit(1); }
});

let dockerAvailable = false;
let provisioningChecked = false;
(async () => {
  try {
    const { isDockerReady } = require('./lib/container-manager').default;
    dockerAvailable = await isDockerReady();
    if (dockerAvailable) log.info('[Provisioning] Railway API available');
    else log.warn('[Provisioning] Railway API unreachable');
  } catch { log.warn('[Provisioning] Railway check failed'); }
  provisioningChecked = true;
})();

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  const match = req.url?.match(/^\/api\/openclaw\/proxy\/([a-zA-Z0-9_-]+)(\/.*)?$/);
  if (match) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return; }
    const token = auth.substring(7);
    if (Buffer.from(token).length !== Buffer.from(API_KEY).length || !timingSafeEqual(Buffer.from(token), Buffer.from(API_KEY))) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
    const agentId = match[1];
    const target = `http://agentbot-agent-${agentId}.railway.internal:18789`;
    openclawProxy.ws(Object.assign({}, req, { url: match[2] || '/' }) as http.IncomingMessage, socket, head, { target });
  } else {
    socket.destroy();
  }
});

import { setupWebSocket } from './lib/hooks/ws-handler';
const permissionWss = setupWebSocket(server);
log.info('[WS] Permission WebSocket registered');

let serverStarted = false;
export function startServer() {
  if (serverStarted) return server;
  server.listen(PORT, () => {
    log.info('Agentbot API started', { details: { port: PORT, mode: RUN_MODE } })
    if (process.env.NODE_ENV === 'production' && RUN_MODE !== 'worker') startAutoUpdater(DATA_DIR, OPENCLAW_HOME_DIR, getPlanResources);
  });
  serverStarted = true;
  return server;
}

if (require.main === module) startServer();

process.on('SIGTERM', () => {
  log.info('[API] Shutting down...');
  stopScheduler();
  if (serverStarted) {
    server.close(() => { log.info('[API] Connections drained. Exiting.'); process.exit(0); });
    setTimeout(() => { log.warn('[API] Forced shutdown.'); process.exit(1); }, 10_000).unref();
  } else {
    process.exit(0);
  }
});

export { server, permissionWss };
export default app;
