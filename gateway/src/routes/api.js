/**
 * routes/api.js
 *
 * Internal API endpoints used by the admin UI panels.
 *
 * GET  /api/status          — gateway state + uptime
 * GET  /api/logs            — last N log lines
 * GET  /api/logs/stream     — SSE live log stream
 * GET  /api/events          — SSE gateway state events
 * POST /api/gateway/restart — restart the gateway process
 * POST /api/gateway/stop    — stop the gateway
 * GET  /api/config          — read current openclaw.json
 * POST /api/config          — write updated openclaw.json (triggers hot reload)
 * GET  /api/pairing/pending — list pending device pair requests
 * POST /api/pairing/approve — approve a pending pair request
 * POST /api/pairing/reject  — reject a pending pair request
 * GET  /api/pairing/paired  — list currently paired devices
 * GET  /api/setup-ui        — serves the inline setup HTML (fallback)
 */

import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { config } from '../config/index.js';
import { OPENCLAW_GATEWAY_TOKEN } from '../config/index.js';
import { gatewayManager } from '../services/gatewayManager.js';
import { pairingService } from '../services/pairingService.js';
import { getActiveSessionCount } from '../services/terminalService.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { log } from '../utils/log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const apiRoutes = Router();

// ── Public endpoints (no auth) — needed for Railway healthcheck ───
// These must be registered BEFORE the requireAdminAuth middleware.

apiRoutes.get('/status', async (req, res) => {
  let aiProvider = null;
  try {
    const cfg = await config.readConfig();
    if (cfg?.agents?.defaults?.model?.primary) {
      aiProvider = cfg.agents.defaults.model.primary;
    }
  } catch {}
  res.json({
    state: gatewayManager.getState(),
    running: gatewayManager.isRunning(),
    configured: true,
    uptime: process.uptime(),
    terminalSessions: getActiveSessionCount(),
    gatewayToken: OPENCLAW_GATEWAY_TOKEN || null,
    aiProvider,
    ts: new Date().toISOString(),
  });
});

// ── Protected routes — everything below requires admin auth ────────
apiRoutes.use(requireAdminAuth);

// ── Logs ──────────────────────────────────────────────────────────

apiRoutes.get('/logs', (req, res) => {
  const n = Math.min(parseInt(req.query.lines || '100', 10), 500);
  res.json({ logs: gatewayManager.getLogs(n) });
});

/**
 * SSE: live log stream
 * Client receives newline-delimited JSON: { ts, stream, line }
 */
apiRoutes.get('/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send recent history first
  const recent = gatewayManager.getLogs(50);
  recent.forEach((entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  });

  const handler = (entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  };

  gatewayManager.on('log', handler);

  req.on('close', () => {
    gatewayManager.off('log', handler);
  });
});

/**
 * SSE: gateway state changes
 * Client receives: { state: 'running'|'starting'|'crashed'|'stopped' }
 */
apiRoutes.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current state immediately
  res.write(`data: ${JSON.stringify({ state: gatewayManager.getState() })}\n\n`);

  const handler = (state) => {
    res.write(`data: ${JSON.stringify({ state })}\n\n`);
  };

  gatewayManager.on('stateChange', handler);

  req.on('close', () => {
    gatewayManager.off('stateChange', handler);
  });
});

// ── Gateway control ──────────────────────────────────────────────

apiRoutes.post('/gateway/restart', async (req, res) => {
  try {
    await gatewayManager.restart();
    res.json({ ok: true, message: 'Gateway restarting...' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

apiRoutes.post('/gateway/stop', async (req, res) => {
  try {
    await gatewayManager.stop();
    res.json({ ok: true, message: 'Gateway stopped.' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Config ────────────────────────────────────────────────────────

apiRoutes.get('/config', async (req, res) => {
  const cfg = await config.readConfig();
  if (!cfg) return res.status(404).json({ ok: false, error: 'No config found' });
  // Strip sensitive fields before returning
  res.json({ ok: true, config: sanitizeConfigForDisplay(cfg) });
});

apiRoutes.post('/config', async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ ok: false, error: 'Invalid config body' });
    }
    await config.writeConfig(incoming);
    log.info('Config updated via API — openclaw will hot-reload');
    res.json({ ok: true, message: 'Config written. Hot reload in progress...' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Device Pairing ────────────────────────────────────────────────

/**
 * List pending pairing requests
 * Reads from ~/.openclaw/nodes/pending.json
 */
apiRoutes.get('/pairing/pending', async (req, res) => {
  try {
    const pending = await pairingService.getPending();
    res.json({ ok: true, pending });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Approve a pending pair request
 * Calls: openclaw devices approve <requestId>
 */
apiRoutes.post('/pairing/approve', async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ ok: false, error: 'requestId required' });
  }
  try {
    await pairingService.approve(requestId);
    res.json({ ok: true, message: `Request ${requestId} approved` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Reject a pending pair request
 */
apiRoutes.post('/pairing/reject', async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ ok: false, error: 'requestId required' });
  }
  try {
    await pairingService.reject(requestId);
    res.json({ ok: true, message: `Request ${requestId} rejected` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Revoke a paired device token
 */
apiRoutes.post('/pairing/revoke', async (req, res) => {
  const { deviceId, role } = req.body;
  if (!deviceId || !role) {
    return res.status(400).json({ ok: false, error: 'deviceId and role required' });
  }
  try {
    await pairingService.revoke(deviceId, role);
    res.json({ ok: true, message: `Device ${deviceId} revoked` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * List currently paired devices
 */
apiRoutes.get('/pairing/paired', async (req, res) => {
  try {
    const paired = await pairingService.getPaired();
    res.json({ ok: true, paired });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Setup UI (inline fallback) ─────────────────────────────────────

apiRoutes.get('/setup-ui', (req, res) => {
  // Redirect to the main setup page
  res.redirect('/setup');
});

// ─── Helpers ──────────────────────────────────────────────────────

function sanitizeConfigForDisplay(cfg) {
  // Deep clone then redact obvious secrets
  const clone = JSON.parse(JSON.stringify(cfg));

  const REDACTED = '[redacted]';
  const SENSITIVE_KEYS = new Set([
    'botToken', 'token', 'appToken', 'apiKey', 'password',
    'serviceAccount', 'secret', 'key', 'auth',
  ]);

  function redact(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const k of Object.keys(obj)) {
      if (SENSITIVE_KEYS.has(k) && typeof obj[k] === 'string') {
        obj[k] = REDACTED;
      } else {
        redact(obj[k]);
      }
    }
    return obj;
  }

  return redact(clone);
}