/**
 * x402-Gateway v3.0.1
 *
 * HTTP gateway between Agentbot agents and borg-0's x402 endpoints.
 * Handles colony fitness scoring, dynamic pricing, and payment proxying.
 *
 * Endpoints:
 *   GET  /health                  — service status
 *   GET  /gateway/endpoints       — borg-0's x402 endpoints + fitness
 *   GET  /gateway/fitness/:id     — agent fitness score (in-memory)
 *   GET  /gateway/pricing/:id     — dynamic pricing by fitness
 *   POST /gateway/colony/join     — join borg-0's colony
 *   POST /gateway/pay             — x402 payment flow
 */

import express from 'express';
import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';

const PORT = parseInt(process.env.PORT || '3000', 10);
const BORG_0_URL = (process.env.BORG_0_URL || 'https://borg-0-production.up.railway.app').replace(/\/$/, '');
const DATA_FILE = process.env.DATA_FILE || '/tmp/x402-gateway-data.json';

const log = {
  info: (...a) => console.log(`[${new Date().toISOString()}] INFO`, ...a),
  warn: (...a) => console.warn(`[${new Date().toISOString()}] WARN`, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] ERROR`, ...a),
};

// ── In-memory state ─────────────────────────────────────────────
let state = {
  agents: {},    // agentId → { fitness: number, joinedAt: string }
  joinCount: 0,
  payCount: 0,
};

async function loadState() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    state = { ...state, ...JSON.parse(raw) };
    log.info(`State loaded from ${DATA_FILE} (${Object.keys(state.agents).length} agents)`);
  } catch {
    log.info('No persisted state — starting fresh');
  }
}

async function persistState() {
  try {
    await writeFile(DATA_FILE, JSON.stringify(state), 'utf8');
  } catch (err) {
    log.warn('Failed to persist state:', err.message);
  }
}

// ── Borg-0 proxy helper ─────────────────────────────────────────
async function borgFetch(path, options = {}) {
  const url = `${BORG_0_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15_000),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`borg-0 ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Pricing tiers (dynamic by fitness) ─────────────────────────
function pricingForFitness(fitness) {
  if (fitness >= 80) return { tier: 'elite', multiplier: 0.5, base: 0.001 };
  if (fitness >= 60) return { tier: 'high', multiplier: 0.75, base: 0.001 };
  if (fitness >= 40) return { tier: 'standard', multiplier: 1.0, base: 0.001 };
  if (fitness >= 20) return { tier: 'low', multiplier: 1.5, base: 0.001 };
  return { tier: 'minimal', multiplier: 2.0, base: 0.001 };
}

// ── Express app ─────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'x402-gateway',
    version: '3.0.1',
    borgUrl: BORG_0_URL,
    agents: Object.keys(state.agents).length,
    joinCount: state.joinCount,
    payCount: state.payCount,
    timestamp: new Date().toISOString(),
  });
});

// Borg-0 endpoints + fitness
app.get('/gateway/endpoints', async (_req, res) => {
  try {
    const data = await borgFetch('/soul/endpoints').catch(() => null);
    res.json({
      borgUrl: BORG_0_URL,
      endpoints: data?.endpoints ?? [
        { name: 'script-x402-belief', price: '$0.001', currency: 'pathUSD' },
        { name: 'clone', price: '$1.00', currency: 'pathUSD' },
      ],
      raw: data,
    });
  } catch (err) {
    res.status(502).json({ error: 'borg-0 unreachable', detail: err.message });
  }
});

// Agent fitness
app.get('/gateway/fitness/:id', (req, res) => {
  const id = req.params.id;
  const agent = state.agents[id];
  if (!agent) {
    return res.json({ agentId: id, fitness: 0, registered: false });
  }
  res.json({ agentId: id, fitness: agent.fitness, joinedAt: agent.joinedAt, registered: true });
});

// Dynamic pricing
app.get('/gateway/pricing/:id', (req, res) => {
  const id = req.params.id;
  const fitness = state.agents[id]?.fitness ?? 0;
  const pricing = pricingForFitness(fitness);
  res.json({ agentId: id, fitness, pricing });
});

// Join borg-0 colony
app.post('/gateway/colony/join', async (req, res) => {
  const { agentId, walletAddress, designation } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });

  try {
    const borgRes = await borgFetch('/soul/colony/join', {
      method: 'POST',
      body: JSON.stringify({ agentId, walletAddress, designation }),
    }).catch(() => null);

    const fitness = borgRes?.fitness ?? 32;
    state.agents[agentId] = {
      fitness,
      joinedAt: new Date().toISOString(),
      walletAddress: walletAddress || null,
    };
    state.joinCount += 1;
    await persistState();

    res.json({ ok: true, agentId, fitness, borgResponse: borgRes });
  } catch (err) {
    res.status(502).json({ error: 'Colony join failed', detail: err.message });
  }
});

// x402 payment
app.post('/gateway/pay', async (req, res) => {
  const { agentId, endpoint, payload } = req.body || {};
  if (!agentId || !endpoint) {
    return res.status(400).json({ error: 'agentId and endpoint required' });
  }

  try {
    const borgRes = await borgFetch(`/x402/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify({ agentId, ...payload }),
    });

    // Update fitness on successful payment
    if (state.agents[agentId]) {
      state.agents[agentId].fitness = Math.min(100, (state.agents[agentId].fitness || 0) + 1);
    }
    state.payCount += 1;
    await persistState();

    res.json({ ok: true, agentId, endpoint, result: borgRes });
  } catch (err) {
    res.status(502).json({ error: 'Payment failed', detail: err.message });
  }
});

// ── Start ───────────────────────────────────────────────────────
async function main() {
  await loadState();
  const server = createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    log.info(`x402-gateway listening on port ${PORT}`);
    log.info(`borg-0 URL: ${BORG_0_URL}`);
  });

  const shutdown = async (sig) => {
    log.info(`${sig} — shutting down`);
    await persistState();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
