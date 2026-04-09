/**
 * openclaw-railway — server.js
 *
 * Single entry point. Responsibilities:
 *  1. Boot Express on PORT (Railway's public port)
 *  2. If openclaw.json already exists on the volume → launch gateway immediately
 *  3. Proxy all /ui/* traffic through to openclaw's gateway once it's up
 *  4. Serve the Setup UI and admin dashboard when needed
 *  5. Attach terminal WebSocket at /ws/terminal
 *  6. Push pairing SSE events when pending.json changes
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

import { config } from './config/index.js';
import { gatewayManager } from './services/gatewayManager.js';
import { pairingService } from './services/pairingService.js';
import { attachTerminalWebSocket, terminalWss } from './services/terminalService.js';
import { setupRoutes } from './routes/setup.js';
import { apiRoutes } from './routes/api.js';
import { proxyMiddleware } from './middleware/proxy.js';
import { requestLogger } from './middleware/logger.js';
import { requireAdminAuth, setAuthCookie, clearAuthCookie } from './middleware/auth.js';
import { ensureDataDir } from './utils/fs.js';
import { log } from './utils/log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // ── Startup sanity checks ──────────────────────────────────────
  try {
    execFileSync('openclaw', ['--version'], { stdio: 'ignore' });
  } catch {
    log.error('❌ `openclaw` binary not found in PATH.');
    log.error('   PATH = ' + process.env.PATH);
    log.error('   Check that node_modules/.bin is in PATH (Dockerfile ENV PATH setting).');
    process.exit(1);
  }

  // 1. Ensure all required directories exist on the volume
  await ensureDataDir();

  const app = express();
  const httpServer = createServer(app);

  // ── Middleware ─────────────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Static files for wrapper UI (setup/admin pages)
  // ── Routes ─────────────────────────────────────────────────────

  // 402index.io domain verification
  app.get('/.well-known/402index-verify.txt', (req, res) => {
    res.type('text/plain').send('e4faad5ad0858b64d6bf3a5b91e1ba57a15e8e5753dfa207b158ffb24bf5087a');
  });

  // Internal management API — always available
  app.use('/api', apiRoutes);

  // Setup flow routes
  app.use('/setup', setupRoutes);

  /**
   * SSE: real-time pairing pending updates
   * Protected by admin auth.
   */
  app.get('/api/pairing/stream', requireAdminAuth, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    pairingService.getPending().then((pending) => {
      res.write(`data: ${JSON.stringify({ type: 'pending', pending })}\n\n`);
    }).catch(() => {});

    const onPendingChanged = (pending) => {
      res.write(`data: ${JSON.stringify({ type: 'pending', pending })}\n\n`);
    };
    const onPairingUpdate = (evt) => {
      res.write(`data: ${JSON.stringify({ type: 'update', ...evt })}\n\n`);
    };

    pairingService.on('pendingChanged', onPendingChanged);
    pairingService.on('pairingUpdate',  onPairingUpdate);

    req.on('close', () => {
      pairingService.off('pendingChanged', onPendingChanged);
      pairingService.off('pairingUpdate',  onPairingUpdate);
    });
  });

  // Root routing — when gateway is running, proxy openclaw UI at /.
  // When not configured, redirect to /setup.
  app.get('/', (req, res, next) => {
    if (gatewayManager.isRunning()) return next(); // fall through to proxy below
    res.redirect('/setup');
  });

  // /ui/* kept for backwards compat — redirect to /
  app.use('/ui', (req, res) => res.redirect('/' + (req.url || '').replace(/^\//, '')));

  // Login page
  app.get('/login', (req, res) => {
    if (!config.WRAPPER_ADMIN_PASSWORD) return res.redirect('/admin');
    const returnTo = req.query.returnTo || '/admin';
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>OpenClaw Login</title>
<style>*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0f14;color:#c9d1d9;font-family:'IBM Plex Mono',monospace;
display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#14181f;border:1px solid #252d3d;border-radius:12px;padding:40px;width:360px}
h1{font-size:18px;color:#e85d26;margin-bottom:24px;text-align:center}
label{font-size:12px;color:#6b7688;display:block;margin-bottom:6px}
input{width:100%;background:#0d0f14;border:1px solid #252d3d;border-radius:7px;
color:#c9d1d9;font-family:inherit;font-size:13px;padding:9px 12px;outline:none;margin-bottom:16px}
input:focus{border-color:#e85d26}
button{width:100%;background:#e85d26;border:none;border-radius:8px;color:white;
font-family:inherit;font-size:14px;font-weight:600;padding:12px;cursor:pointer}
button:hover{background:#f0883e}
.err{color:#f85149;font-size:12px;margin-bottom:12px;text-align:center}</style>
</head><body><div class="card">
<h1>🦞 OpenClaw Admin</h1>
${req.query.err ? '<p class="err">Incorrect password</p>' : ''}
<form method="POST" action="/login">
<input type="hidden" name="returnTo" value="${returnTo}">
<label>Admin Password</label>
<input type="password" name="password" autofocus placeholder="Enter password">
<button type="submit">Sign In</button>
</form></div></body></html>`);
  });

  app.post('/login', express.urlencoded({ extended: false }), (req, res) => {
    const { password, returnTo = '/admin' } = req.body;
    if (!config.WRAPPER_ADMIN_PASSWORD || password === config.WRAPPER_ADMIN_PASSWORD) {
      setAuthCookie(res, password);
      return res.redirect(returnTo);
    }
    const r = encodeURIComponent(returnTo);
    res.redirect(`/login?returnTo=${r}&err=1`);
  });

  app.get('/logout', (req, res) => {
    clearAuthCookie(res);
    res.redirect('/login');
  });

  // Admin dashboard
  app.get('/admin', requireAdminAuth, async (req, res) => {
    if (!(await config.isAlreadyConfigured())) {
      return res.redirect('/setup');
    }
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  });

  // ── Catch-all proxy — MUST be last ────────────────────────────
  // All our own routes (/api, /setup, /admin, /login, /logout, /ws)
  // are registered above. Everything else proxies to openclaw gateway.
  app.use('/', proxyMiddleware);

  // ── WebSocket services ─────────────────────────────────────────
  // Initialize terminal WSS (registers connection handler, but NOT
  // an upgrade listener — we use noServer mode).
  attachTerminalWebSocket(httpServer);

  // Single upgrade handler — routes /ws/terminal to terminal WSS,
  // everything else to gateway WS proxy. This avoids the ws library's
  // abortHandshake(400) which would destroy non-terminal sockets.
  httpServer.on('upgrade', (req, socket, head) => {
    const url = req.url || '';

    if (url.startsWith('/ws/terminal')) {
      terminalWss.handleUpgrade(req, socket, head, (ws) => {
        terminalWss.emit('connection', ws, req);
      });
      return;
    }

    // Everything else → gateway WS proxy
    gatewayManager.handleWsUpgrade(req, socket, head);
  });

  // ── Start listening ────────────────────────────────────────────
  const PORT = config.PORT;
  httpServer.listen(PORT, '0.0.0.0', () => {
    log.info(`🦞 openclaw-railway listening on port ${PORT}`);
  });

  // ── Auto-launch if already configured ─────────────────────────
  if (await config.isAlreadyConfigured()) {
    log.info('Existing config found — launching OpenClaw gateway automatically...');
    try {
      await gatewayManager.start();
    } catch (err) {
      log.error('Auto-launch failed:', err.message);
    }
  } else {
    log.info('No config found — serving Setup UI at /setup');
  }

  // ── Graceful shutdown ──────────────────────────────────────────
  const shutdown = async (signal) => {
    log.info(`Received ${signal} — shutting down...`);
    await gatewayManager.stop();
    httpServer.close(() => {
      log.info('HTTP server closed. Goodbye.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});