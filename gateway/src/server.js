/**
 * Agentbot OpenClaw Gateway Wrapper
 *
 * Manages the OpenClaw gateway process with:
 *  - Auto-config from env vars (no setup wizard needed — agentbot provisions everything)
 *  - Health endpoint for Railway auto-restart
 *  - Process management with exponential backoff restart
 *  - Persistent storage on Railway volume (/data)
 *  - HTTP proxy to OpenClaw gateway for the Control UI
 */

import express from 'express';
import { createServer } from 'http';
import { spawn, execFileSync } from 'child_process';
import { EventEmitter } from 'events';
import httpProxy from 'http-proxy';
import net from 'net';
import fs from 'fs/promises';
import path from 'path';

// ── Config ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = process.env.OPENCLAW_DATA_DIR || '/data';
const OPENCLAW_HOME = path.join(DATA_DIR, '.openclaw');
const CONFIG_PATH = path.join(OPENCLAW_HOME, 'openclaw.json');
const GATEWAY_PORT = 18789;
const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

// ── Logging ─────────────────────────────────────────────────────
const log = {
  info: (...args) => console.log(`[${new Date().toISOString()}] INFO`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}] WARN`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] ERROR`, ...args),
};

// ── Gateway Manager ─────────────────────────────────────────────
class GatewayManager extends EventEmitter {
  constructor() {
    super();
    this._proc = null;
    this._state = 'stopped';
    this._restartCount = 0;
    this._restartTimer = null;
    this._logs = [];
    this._startTime = null;

    this._proxy = httpProxy.createProxyServer({
      target: `http://${GATEWAY_HOST}:${GATEWAY_PORT}`,
      changeOrigin: true,
      xfwd: true,
      proxyTimeout: 120_000,
      timeout: 120_000,
    });

    this._proxy.on('proxyReq', (proxyReq) => {
      if (GATEWAY_TOKEN) {
        proxyReq.setHeader('Authorization', `Bearer ${GATEWAY_TOKEN}`);
      }
    });

    this._proxy.on('error', (err, _req, res) => {
      if (res && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Gateway not reachable', detail: err.message }));
      }
    });
  }

  isRunning() { return this._state === 'running'; }
  getState() { return this._state; }
  getLogs(n = 100) { return this._logs.slice(-n); }
  getUptime() { return this._startTime ? Date.now() - this._startTime : 0; }

  async start() {
    if (this._state === 'running' || this._state === 'starting') return;
    this._state = 'starting';
    this._restartCount = 0;
    this._spawn();

    try {
      await this._waitForReady();
      this._state = 'running';
      this._startTime = Date.now();
      log.info('OpenClaw gateway is ready');
    } catch (err) {
      log.error('Gateway failed to start:', err.message);
      this._state = 'crashed';
    }
  }

  async stop() {
    if (this._restartTimer) { clearTimeout(this._restartTimer); this._restartTimer = null; }
    if (this._proc) { this._proc.kill('SIGTERM'); this._proc = null; }
    this._state = 'stopped';
    this._startTime = null;
  }

  async restart() {
    await this.stop();
    await new Promise(r => setTimeout(r, 500));
    await this.start();
  }

  proxyRequest(req, res) {
    this._proxy.web(req, res);
  }

  handleWsUpgrade(req, socket, head) {
    if (!this.isRunning()) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    // Raw TCP pipe to gateway — avoids http-proxy WS bugs on Node 22
    const proxySocket = net.connect(GATEWAY_PORT, GATEWAY_HOST, () => {
      let raw = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
      let hasAuth = false;

      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const key = req.rawHeaders[i];
        const val = req.rawHeaders[i + 1];
        const lower = key.toLowerCase();

        if (lower === 'host') {
          raw += `${key}: ${GATEWAY_HOST}:${GATEWAY_PORT}\r\n`;
        } else if (lower === 'authorization') {
          hasAuth = true;
          raw += `${key}: Bearer ${GATEWAY_TOKEN}\r\n`;
        } else {
          raw += `${key}: ${val}\r\n`;
        }
      }

      if (!hasAuth && GATEWAY_TOKEN) {
        raw += `Authorization: Bearer ${GATEWAY_TOKEN}\r\n`;
      }
      raw += '\r\n';

      proxySocket.write(raw);
      if (head && head.length > 0) proxySocket.write(head);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
    socket.on('close', () => proxySocket.destroy());
    proxySocket.on('close', () => socket.destroy());
  }

  _spawn() {
    log.info('Spawning OpenClaw gateway...');

    const args = ['gateway', 'run', '--bind', 'loopback', '--port', String(GATEWAY_PORT), '--allow-unconfigured'];
    if (GATEWAY_TOKEN) args.push('--auth', 'token', '--token', GATEWAY_TOKEN);

    this._proc = spawn('openclaw', args, {
      env: { ...process.env, HOME: DATA_DIR, OPENCLAW_STATE_DIR: OPENCLAW_HOME },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this._proc.stdout.on('data', (d) => d.toString().split('\n').filter(Boolean).forEach(l => this._log('stdout', l)));
    this._proc.stderr.on('data', (d) => d.toString().split('\n').filter(Boolean).forEach(l => this._log('stderr', l)));

    this._proc.on('exit', (code, signal) => {
      log.warn(`Gateway exited (code=${code}, signal=${signal})`);
      this._proc = null;
      if (this._state !== 'stopped') {
        this._state = 'crashed';
        this._scheduleRestart();
      }
    });

    this._proc.on('error', (err) => {
      log.error('Failed to spawn openclaw:', err.message);
      this._state = 'crashed';
      this._scheduleRestart();
    });
  }

  _scheduleRestart() {
    const delay = Math.min(2000 * Math.pow(2, this._restartCount), 30_000);
    this._restartCount++;
    log.info(`Restart in ${delay}ms (attempt #${this._restartCount})`);

    this._restartTimer = setTimeout(async () => {
      this._restartTimer = null;
      this._spawn();
      try {
        await this._waitForReady();
        this._state = 'running';
        this._startTime = Date.now();
        log.info('Gateway recovered');
      } catch {
        this._scheduleRestart();
      }
    }, delay);
  }

  _waitForReady() {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 60_000;
      const poll = () => {
        if (Date.now() > deadline) return reject(new Error('Gateway not ready after 60s'));
        const s = new net.Socket();
        s.setTimeout(500);
        s.on('connect', () => { s.destroy(); resolve(); });
        s.on('error', () => { s.destroy(); setTimeout(poll, 500); });
        s.on('timeout', () => { s.destroy(); setTimeout(poll, 500); });
        s.connect(GATEWAY_PORT, GATEWAY_HOST);
      };
      poll();
    });
  }

  _log(stream, line) {
    const entry = { ts: new Date().toISOString(), stream, line };
    this._logs.push(entry);
    if (this._logs.length > 500) this._logs.shift();
    this.emit('log', entry);
  }
}

// ── Config Builder ──────────────────────────────────────────────
async function writeOpenClawConfig() {
  await fs.mkdir(OPENCLAW_HOME, { recursive: true });
  await fs.mkdir(path.join(OPENCLAW_HOME, 'workspace'), { recursive: true });

  const config = {
    env: {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    },
    gateway: {
      mode: 'local',
      bind: 'loopback',
      port: GATEWAY_PORT,
      auth: {
        mode: GATEWAY_TOKEN ? 'token' : 'none',
        token: GATEWAY_TOKEN || undefined,
        rateLimit: { maxAttempts: 10, windowMs: 60000, lockoutMs: 300000 },
      },
      trustedProxies: ['127.0.0.1', '10.0.0.0/8', '100.64.0.0/10'],
      controlUi: {
        allowedOrigins: ['*'],
        dangerouslyDisableDeviceAuth: true,
      },
      http: { endpoints: { chatCompletions: { enabled: true } } },
      reload: { mode: 'hybrid', debounceMs: 300 },
    },
    agents: {
      defaults: {
        workspace: path.join(OPENCLAW_HOME, 'workspace'),
        userTimezone: 'Europe/London',
        model: {
          primary: 'openrouter/xiaomi/mimo-v2-pro',
          fallbacks: ['openrouter/anthropic/claude-sonnet-4', 'openrouter/google/gemini-2.5-flash'],
        },
        models: {
          'openrouter/xiaomi/mimo-v2-pro': { alias: 'mimo' },
          'openrouter/anthropic/claude-sonnet-4': { alias: 'sonnet' },
          'openrouter/google/gemini-2.5-flash': { alias: 'gemini' },
        },
        thinkingDefault: 'low',
        verboseDefault: 'off',
        timeoutSeconds: 600,
        maxConcurrent: 3,
        heartbeat: { every: '30m', lightContext: true, isolatedSession: true },
      },
    },
    tools: {
      profile: 'coding',
      exec: { backgroundMs: 10000, timeoutSec: 1800 },
      web: { search: { enabled: true }, fetch: { enabled: true, maxChars: 50000 } },
    },
    session: {
      scope: 'per-sender',
      reset: { mode: 'daily', atHour: 4 },
      maintenance: { mode: 'warn', pruneAfter: '30d', maxEntries: 500 },
    },
    channels: {
      telegram: { enabled: false, dmPolicy: 'pairing' },
      discord: { enabled: false, dmPolicy: 'pairing' },
      whatsapp: { enabled: false, dmPolicy: 'pairing' },
      webchat: { enabled: true },
    },
    cron: { enabled: true, maxConcurrentRuns: 2, sessionRetention: '24h' },
    logging: { level: 'info', consoleLevel: 'info', consoleStyle: 'compact' },
  };

  // Atomic write
  const tmp = CONFIG_PATH + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(config, null, 2), 'utf8');
  await fs.rename(tmp, CONFIG_PATH);
  log.info('OpenClaw config written to', CONFIG_PATH);
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  // Verify openclaw binary exists
  try {
    execFileSync('openclaw', ['--version'], { stdio: 'ignore' });
  } catch {
    log.error('openclaw binary not found in PATH');
    process.exit(1);
  }

  // Write config from env vars
  await writeOpenClawConfig();

  const gw = new GatewayManager();
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // ── Health check — Railway uses this to detect unhealthy containers ──
  app.get('/healthz', (_req, res) => {
    res.json({
      status: gw.isRunning() ? 'healthy' : gw.getState(),
      gateway: gw.getState(),
      uptime: gw.getUptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── Status API — more detail for agentbot dashboard ──
  app.get('/api/status', (_req, res) => {
    res.json({
      online: gw.isRunning(),
      state: gw.getState(),
      uptime: gw.getUptime(),
      logsCount: gw.getLogs().length,
    });
  });

  // ── Logs — last N lines of gateway output ──
  app.get('/api/logs', (req, res) => {
    const n = Math.min(parseInt(req.query.lines || '100', 10), 500);
    res.json({ logs: gw.getLogs(n) });
  });

  // ── Gateway control ──
  app.post('/api/restart', async (_req, res) => {
    try {
      await gw.restart();
      res.json({ ok: true, state: gw.getState() });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Proxy everything else to OpenClaw gateway ──
  app.use('/', (req, res, next) => {
    if (gw.isRunning()) {
      gw.proxyRequest(req, res);
    } else {
      res.status(503).json({
        error: 'OpenClaw gateway is not running',
        state: gw.getState(),
        hint: 'The gateway is starting up or has crashed. Check /healthz for status.',
      });
    }
  });

  // WebSocket upgrade — proxy to gateway
  server.on('upgrade', (req, socket, head) => {
    gw.handleWsUpgrade(req, socket, head);
  });

  server.listen(PORT, '0.0.0.0', () => {
    log.info(`Agentbot OpenClaw wrapper listening on port ${PORT}`);
  });

  // Launch gateway
  log.info('Starting OpenClaw gateway...');
  await gw.start();

  // Graceful shutdown
  const shutdown = async (sig) => {
    log.info(`${sig} — shutting down`);
    await gw.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
