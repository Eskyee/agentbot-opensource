/**
 * OpenClaw runtime info routes
 *
 * GET /api/openclaw/version    — Runtime version + image info
 * GET /api/openclaw/instances  — List all running containers
 * GET /api/openclaw/instances/:id/stats — Per-container live stats
 * ALL /api/openclaw/proxy/:agentId/* — Transparent HTTP+WS proxy to Railway internal
 *
 * The proxy route forwards requests to agentbot-agent-{agentId}.railway.internal:18789
 * so the OpenClaw Control UI is accessible without exposing the container publicly.
 * No auth required on the proxy itself — OpenClaw's own token auth handles that.
 */
import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import httpProxy from 'http-proxy';
import { runCommand } from '../utils';
import { DEFAULT_OPENCLAW_IMAGE, OPENCLAW_RUNTIME_VERSION } from '../lib/openclaw-version';

const router = Router();

// ── OpenClaw proxy — forwards to Railway internal DNS ──────────────────────
const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true });

proxy.on('error', (err, _req, res) => {
  console.error('[OpenClaw proxy] error:', err.message);
  if (res && 'writeHead' in res) {
    (res as Response).writeHead(502);
    (res as Response).end('OpenClaw instance unreachable');
  }
});

/**
 * Proxy all HTTP requests for /api/openclaw/proxy/:agentId/* to the Railway internal address.
 * WebSocket upgrades are handled separately in index.ts (see server.on('upgrade')).
 */
router.use('/proxy/:agentId', (req: Request, res: Response) => {
  const agentId = req.params.agentId.replace(/[^a-zA-Z0-9_-]/g, '');
  const target = `http://agentbot-agent-${agentId}.railway.internal:18789`;
  // Rewrite path: strip /api/openclaw/proxy/:agentId prefix
  req.url = req.url.replace(/^\/[^/]+/, '') || '/';
  proxy.web(req, res, { target });
});

export { proxy };

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_IMAGE = DEFAULT_OPENCLAW_IMAGE;

type AgentMetadata = {
  agentId: string;
  createdAt: string;
  plan: string;
  subdomain?: string;
  [key: string]: unknown;
};

const sanitizeAgentId = (v: string): string => v.replace(/[^a-zA-Z0-9_-]/g, '');
const getContainerName = (id: string): string => `openclaw-${sanitizeAgentId(id)}`;

const readAgentMetadata = async (agentId: string): Promise<AgentMetadata | null> => {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, 'agents', `${sanitizeAgentId(agentId)}.json`), 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
};

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// Version info
router.get('/version', (_req: Request, res: Response) => {
  res.json({
    openclawVersion: OPENCLAW_RUNTIME_VERSION,
    image: OPENCLAW_IMAGE,
    deployedAt: new Date().toISOString(),
  });
});

// List instances
router.get('/instances', async (_req: Request, res: Response) => {
  try {
    const { stdout } = await runCommand('docker', [
      'ps', '--filter', 'name=openclaw-',
      '--format', '{{.Names}}|{{.Image}}|{{.Status}}|{{.CreatedAt}}'
    ]);
    const lines = stdout ? stdout.split('\n').filter(Boolean) : [];
    const instances = await Promise.all(lines.map(async (line) => {
      const [name, image, status, createdAt] = line.split('|');
      const agentId = name.replace('openclaw-', '');
      const metadata = await readAgentMetadata(agentId);
      let containerVersion = 'unknown';
      try {
        const { stdout: v } = await runCommand('docker', ['exec', name, 'openclaw', '--version']);
        containerVersion = v.trim() || 'unknown';
      } catch { /* container may not have openclaw CLI */ }
      return { agentId, name, image, status, createdAt, version: containerVersion, metadata };
    }));
    res.json({ instances, count: instances.length });
  } catch { res.status(500).json({ error: 'Failed to list instances' }); }
});

// Instance stats
router.get('/instances/:id/stats', async (req: Request, res: Response) => {
  const containerName = getContainerName(req.params.id);
  try {
    const { stdout: stats } = await runCommand('docker', [
      'stats', containerName, '--no-stream',
      '--format', '{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}'
    ]);
    const { stdout: inspect } = await runCommand('docker', [
      'inspect', containerName, '--format', '{{.State.StartedAt}}|{{.State.Status}}'
    ]);
    const [cpu, memUsage, memPerc, netIO, blockIO, pids] = stats.trim().split('|');
    const [startedAt, status] = inspect.trim().split('|');
    const uptime = Date.now() - new Date(startedAt).getTime();
    res.json({
      agentId: req.params.id, cpu, memory: memUsage, memoryPercent: memPerc,
      network: netIO, blockIO: blockIO, pids, status, uptime,
      uptimeFormatted: formatUptime(uptime), timestamp: new Date().toISOString(),
    });
  } catch { res.status(500).json({ error: 'Failed to get container stats' }); }
});

export default router;
