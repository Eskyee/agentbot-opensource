/**
 * Agent CRUD + lifecycle routes
 *
 * Extracted from index.ts for maintainability.
 * All endpoints require Bearer token authentication (applied at mount in index.ts).
 *
 * Payment enforcement: POST / (create) requires active subscription or admin role.
 * Agent limits: enforced per plan using DB-backed counts.
 */
import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Pool } from 'pg';
import { runCommand } from '../utils';
import { authenticate } from '../middleware/auth';
import { DEFAULT_OPENCLAW_IMAGE, OPENCLAW_RUNTIME_VERSION, deriveOpenClawVersionFromImage } from '../lib/openclaw-version';

const router = Router();

// Admin emails (bypass payment)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

// --- Types ---

type AgentMetadata = {
  agentId: string;
  createdAt: string;
  plan: string;
  ownerEmail?: string;
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
  verified?: boolean;
  verificationType?: string;
  attestationUid?: string;
  verifierAddress?: string;
  verifiedAt?: string;
  verificationMetadata?: Record<string, unknown>;
};

type ContainerInspect = {
  Config: { Image: string };
  HostConfig: { Memory: number; NanoCpus: number };
  Mounts: Array<{ Type: string; Name?: string; Source?: string; Destination: string }>;
  NetworkSettings: {
    Ports: { '18789/tcp'?: Array<{ HostPort: string }> };
  };
};

// --- Constants ---

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_IMAGE = DEFAULT_OPENCLAW_IMAGE;
const BASE_PORT = Number(process.env.AGENTS_BASE_PORT || '19000');

const DOCKER_IMAGE_REGEX = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?::[0-9]{2,5})?)\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[A-Fa-f0-9]{64})?$/;
const DOCKER_VOLUME_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

const PLAN_RESOURCES: Record<string, { memory: string; cpus: string }> = {
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

// Plan agent limits — matches pricing tiers
const PLAN_AGENT_LIMITS: Record<string, number> = {
  solo: 1,
  collective: 3,
  label: 10,
  network: 999999, // unlimited
};

// --- Ownership Check ---

/**
 * Verifies the requesting user owns the agent.
 * Requires the agent metadata to have ownerEmail set.
 * Admins bypass ownership checks.
 */
async function assertOwnership(req: Request, res: Response, agentId: string): Promise<AgentMetadata | null> {
  const metadata = await readAgentMetadata(agentId);
  if (!metadata) {
    res.status(404).json({ error: 'Agent not found' });
    return null;
  }
  const email = (req as any).userEmail as string;
  const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());
  if (!isAdmin && metadata.ownerEmail && metadata.ownerEmail.toLowerCase() !== (email || '').toLowerCase()) {
    res.status(403).json({ error: 'Forbidden — you do not own this agent' });
    return null;
  }
  return metadata;
}

// DB-backed agent count
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Returns the number of active agents for this email from the DB. */
async function getAgentCount(email: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM agent_registrations
     WHERE user_id = $1 AND status = 'active'`,
    [email]
  );
  return parseInt(result.rows[0]?.cnt ?? '0', 10);
}

// --- Helpers ---

const sanitizeAgentId = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');
const getContainerName = (agentId: string): string => `openclaw-${sanitizeAgentId(agentId)}`;
const agentFilePath = (agentId: string): string => path.join(DATA_DIR, 'agents', `${sanitizeAgentId(agentId)}.json`);
const portsFilePath = (): string => path.join(DATA_DIR, 'ports.json');
const lockFilePath = (): string => path.join(DATA_DIR, 'ports.lock');
const isValidDockerImage = (value: string): boolean => DOCKER_IMAGE_REGEX.test(value);

const getPlanResources = (plan: string) => PLAN_RESOURCES[plan] || PLAN_RESOURCES.starter;

const withLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const lockFile = lockFilePath();
  let retries = 50;
  while (retries > 0) {
    try {
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
  if (retries === 0) throw new Error('Could not acquire lock for ports.json');
  try {
    return await fn();
  } finally {
    try { await fs.unlink(lockFile); } catch { /* best-effort */ }
  }
};

const readPorts = async (): Promise<Record<string, number>> => {
  try { return JSON.parse(await fs.readFile(portsFilePath(), 'utf8')); }
  catch { return {}; }
};

const writePorts = async (ports: Record<string, number>): Promise<void> => {
  await fs.writeFile(portsFilePath(), JSON.stringify(ports, null, 2));
};

const readAgentMetadata = async (agentId: string): Promise<AgentMetadata | null> => {
  try { return JSON.parse(await fs.readFile(agentFilePath(agentId), 'utf8')); }
  catch { return null; }
};

const writeAgentMetadata = async (agent: AgentMetadata): Promise<void> => {
  await fs.writeFile(agentFilePath(agent.agentId), JSON.stringify(agent, null, 2));
};

const containerStatus = async (containerName: string): Promise<{ status: string; startedAt?: string } | null> => {
  try {
    const { stdout } = await runCommand('docker', [
      'inspect', containerName, '--format', '{{.State.Status}}|{{.State.StartedAt}}'
    ]);
    const [rawStatus, startedAt] = stdout.split('|');
    let status = rawStatus;
    if (rawStatus === 'running') status = 'active';
    else if (rawStatus === 'exited') status = 'stopped';
    return { status, startedAt };
  } catch { return null; }
};

const getContainerInspect = async (containerName: string): Promise<ContainerInspect> => {
  const { stdout } = await runCommand('docker', ['inspect', containerName]);
  const parsed = JSON.parse(stdout) as ContainerInspect[];
  if (!parsed[0]) throw new Error('Container inspect returned no data');
  return parsed[0];
};

const getContainerRuntimeVersion = async (containerName: string): Promise<string> => {
  try {
    const script = `
const fs=require('fs');
const p='/home/node/.openclaw/openclaw.json';
if(!fs.existsSync(p)){console.log('');process.exit(0)}
const c=JSON.parse(fs.readFileSync(p,'utf8'));
console.log(c?.meta?.lastTouchedVersion||'');`;
    const encoded = Buffer.from(script, 'utf8').toString('base64');
    const { stdout } = await runCommand('docker', [
      'exec', containerName, 'sh', '-lc',
      `echo "${encoded}" | base64 -d > /tmp/version.js && node /tmp/version.js`
    ]);
    return stdout || OPENCLAW_RUNTIME_VERSION;
  } catch { return OPENCLAW_RUNTIME_VERSION; }
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
console.log('healed:'+current+'->'+legacy[current]);`;
    const encoded = Buffer.from(script, 'utf8').toString('base64');
    const { stdout } = await runCommand('docker', [
      'exec', containerName, 'sh', '-lc',
      `echo "${encoded}" | base64 -d > /tmp/heal-model.js && node /tmp/heal-model.js`
    ]);
    if (stdout.startsWith('healed:')) return { healed: true, message: stdout };
    return { healed: false, message: stdout || 'skip' };
  } catch { return { healed: false, message: 'skip:container-not-running' }; }
};

const backupContainerData = async (containerName: string, inspect: ContainerInspect): Promise<string | null> => {
  const instanceId = containerName.replace('openclaw-', '');
  const mount = inspect.Mounts.find((m) => m.Destination === '/home/node/.openclaw');
  if (!mount) return null;
  const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const backupDir = path.join(DATA_DIR, 'backups', 'openclaw-updates', instanceId);
  const backupFile = path.join(backupDir, `${ts}.tar.gz`);
  await fs.mkdir(backupDir, { recursive: true });
  if (mount.Type === 'volume' && mount.Name) {
    if (!DOCKER_VOLUME_NAME_REGEX.test(mount.Name)) throw new Error('Unsafe docker volume name');
    const child = spawn('sh', ['-c', `docker run --rm -v ${mount.Name}:/data:ro alpine sh -lc 'tar czf - -C /data .' > "${backupFile}"`]);
    return new Promise((resolve, reject) => {
      child.on('close', (code) => code === 0 ? resolve(backupFile) : reject(new Error('Backup failed')));
      child.on('error', reject);
    });
  }
  return null;
};

const recreateContainerWithImage = async (containerName: string, inspect: ContainerInspect, image: string, plan = 'starter'): Promise<void> => {
  const portMapping = inspect.NetworkSettings.Ports['18789/tcp'];
  const hostPort = portMapping?.[0]?.HostPort;
  if (!hostPort) throw new Error('Could not determine host port');
  const mount = inspect.Mounts.find((m) => m.Destination === '/home/node/.openclaw');
  if (!mount) throw new Error('Could not determine data mount');
  const mountSource = mount.Type === 'volume' ? mount.Name : mount.Source;
  if (!mountSource) throw new Error('Unsupported mount configuration');
  const resources = getPlanResources(plan);
  await runCommand('docker', [
    'run', '-d', '--name', containerName, '--restart', 'unless-stopped',
    '-p', `${hostPort}:18789`, `--memory=${resources.memory}`, `--cpus=${resources.cpus}`,
    '-v', `${mountSource}:/home/node/.openclaw`, image
  ]);
};

// --- Routes ---

// List all agents
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { stdout } = await runCommand('docker', [
      'ps', '-a', '--filter', 'name=openclaw-', '--format', '{{.Names}}|{{.Status}}'
    ]);
    const lines = stdout ? stdout.split('\n') : [];
    const results = await Promise.allSettled(lines.filter(Boolean).map(async (line) => {
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
    const agents = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);
    res.json(agents);
  } catch (err) { console.error('[Agents] List failed:', err); res.json([]); }
});

// Create agent (metadata only — no container)
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { name, config } = req.body as { name?: string; config?: Record<string, unknown> };
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }

  // Payment enforcement — admins bypass, everyone else needs subscription
  const email = (req as any).userEmail as string
  const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase())
  const stripeSubscriptionId = config?.stripeSubscriptionId as string | undefined

  if (!isAdmin && !stripeSubscriptionId) {
    res.status(402).json({
      error: 'Active subscription required. Subscribe at /pricing',
      code: 'PAYMENT_REQUIRED',
    });
    return;
  }

  try {
    await fs.mkdir(path.join(DATA_DIR, 'agents'), { recursive: true });
    const safeBase = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 20);
    const suffix = randomBytes(4).toString('hex');
    const agentId = `${safeBase}-${suffix}`;
    const subdomain = `${agentId}.${AGENTS_DOMAIN}`;

    const metadata: AgentMetadata = {
      agentId, createdAt: new Date().toISOString(),
      plan: (config?.plan as string) || 'free',
      aiProvider: (config?.aiProvider as string) || 'openrouter',
      subdomain, status: 'pending', config: config || {},
      ownerEmail: email,
    };
    await writeAgentMetadata(metadata);

    res.status(201).json({
      id: agentId, name, agentId, status: 'pending', subdomain,
      url: `https://${subdomain}`, createdAt: metadata.createdAt,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create agent' });
  }
});

// Get single agent — ownership check if ownerEmail is set
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  try {
    const [runtime, metadata, openclawVersion] = await Promise.all([
      containerStatus(containerName), readAgentMetadata(id), getContainerRuntimeVersion(containerName),
    ]);
    if (!runtime && !metadata) { res.status(404).json({ error: 'Agent not found' }); return; }

    // Ownership check — if ownerEmail is set, verify the requesting user
    if (metadata?.ownerEmail) {
      const email = (req as any).userEmail as string;
      const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());
      if (!isAdmin && metadata.ownerEmail.toLowerCase() !== (email || '').toLowerCase()) {
        res.status(403).json({ error: 'Forbidden — you do not own this agent' });
        return;
      }
    }

    res.json({
      id, status: runtime?.status || 'stopped',
      startedAt: runtime?.startedAt || metadata?.createdAt || new Date().toISOString(),
      plan: metadata?.plan || 'free',
      subdomain: metadata?.subdomain || `${id}.${AGENTS_DOMAIN}`,
      url: `https://${metadata?.subdomain || `${id}.${AGENTS_DOMAIN}`}`,
      openclawVersion,
      verified: metadata?.verified || false,
      verificationType: metadata?.verificationType || null,
      attestationUid: metadata?.attestationUid || null,
      verifiedAt: metadata?.verifiedAt || null,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch agent' });
  }
});

// Update agent — ownership check
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const safeId = sanitizeAgentId(id);
  try {
    const metadata = await assertOwnership(req, res, safeId);
    if (!metadata) return;
    const { plan, aiProvider, config } = req.body as {
      plan?: string; aiProvider?: string; config?: Record<string, unknown>;
    };
    if (plan) metadata.plan = plan;
    if (aiProvider) metadata.aiProvider = aiProvider;
    if (config) metadata.config = { ...(metadata.config || {}), ...config };
    await writeAgentMetadata(metadata);
    res.json({ id: safeId, plan: metadata.plan, aiProvider: metadata.aiProvider, subdomain: metadata.subdomain, status: metadata.status || 'unknown', message: 'Agent updated' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

// Delete agent — ownership check
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const safeId = sanitizeAgentId(id);
  try {
    const metadata = await assertOwnership(req, res, safeId);
    if (!metadata) return;
    const containerName = getContainerName(safeId);
    try { await runCommand('docker', ['stop', containerName]); } catch { /* may already be stopped */ }
    try { await runCommand('docker', ['rm', containerName]); } catch { /* may not exist */ }
    await withLock(async () => {
      const ports = await readPorts();
      delete ports[safeId];
      await writePorts(ports);
    });
    try { await fs.unlink(agentFilePath(safeId)); } catch { /* may not exist */ }
    res.json({ id: safeId, deleted: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Delete failed' });
  }
});

// Verification endpoints
router.get('/:id/verification', async (req: Request, res: Response) => {
  try {
    const metadata = await readAgentMetadata(req.params.id);
    if (!metadata) { res.status(404).json({ error: 'Agent not found' }); return; }
    res.json({
      verified: metadata.verified || false,
      verificationType: metadata.verificationType || null,
      attestationUid: metadata.attestationUid || null,
      verifierAddress: metadata.verifierAddress || null,
      verifiedAt: metadata.verifiedAt || null,
      metadata: metadata.verificationMetadata || null,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch verification' });
  }
});

router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const existing = await assertOwnership(req, res, req.params.id);
    if (!existing) return;
    const { verificationType, verified, attestationUid, verifierAddress, metadata } = req.body;
    existing.verified = verified;
    existing.verificationType = verificationType;
    existing.attestationUid = attestationUid;
    existing.verifierAddress = verifierAddress;
    existing.verifiedAt = verified ? new Date().toISOString() : undefined;
    existing.verificationMetadata = metadata;
    await writeAgentMetadata(existing);
    res.json({ success: true, verified: existing.verified, verificationType: existing.verificationType, attestationUid: existing.attestationUid, verifiedAt: existing.verifiedAt });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update verification' });
  }
});

router.delete('/:id/verify', async (req: Request, res: Response) => {
  try {
    const existing = await assertOwnership(req, res, req.params.id);
    if (!existing) return;
    existing.verified = false;
    existing.verificationType = undefined;
    existing.attestationUid = undefined;
    existing.verifierAddress = undefined;
    existing.verifiedAt = undefined;
    existing.verificationMetadata = undefined;
    await writeAgentMetadata(existing);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to remove verification' });
  }
});

// Lifecycle endpoints — ownership check
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const metadata = await assertOwnership(req, res, req.params.id);
    if (!metadata) return;
    await runCommand('docker', ['start', getContainerName(req.params.id)]);
    res.json({ success: true, status: 'active' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Start failed' });
  }
});

router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const metadata = await assertOwnership(req, res, req.params.id);
    if (!metadata) return;
    await runCommand('docker', ['stop', getContainerName(req.params.id)]);
    res.json({ success: true, status: 'stopped' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Stop failed' });
  }
});

router.post('/:id/restart', async (req: Request, res: Response) => {
  const containerName = getContainerName(req.params.id);
  try {
    const metadata = await assertOwnership(req, res, req.params.id);
    if (!metadata) return;
    const healResult = await healLegacyModelInContainer(containerName);
    await runCommand('docker', ['restart', containerName]);
    const openclawVersion = await getContainerRuntimeVersion(containerName);
    res.json({ success: true, status: 'active', healedLegacyModel: healResult.healed, healMessage: healResult.message, openclawVersion });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Restart failed' });
  }
});

router.post('/:id/update', async (req: Request, res: Response) => {
  const containerName = getContainerName(req.params.id);
  try {
    const metadata = await assertOwnership(req, res, req.params.id);
    if (!metadata) return;
    const requestedImage = typeof req.body?.image === 'string' ? req.body.image.trim() : '';
    const targetImage = requestedImage || OPENCLAW_IMAGE;

    if (!isValidDockerImage(targetImage)) { res.status(400).json({ error: 'Invalid docker image value' }); return; }

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
      openclawVersion: deriveOpenClawVersionFromImage(targetImage),
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

router.get('/:id/token', async (req: Request, res: Response) => {
  try {
    const metadata = await assertOwnership(req, res, req.params.id);
    if (!metadata) return;
    if (!metadata.gatewayToken) {
      metadata.gatewayToken = randomBytes(32).toString('hex');
      await writeAgentMetadata(metadata);
    }
    res.json({ token: metadata.gatewayToken });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get token' });
  }
});

router.post('/:id/repair', async (req: Request, res: Response) => {
  const containerName = getContainerName(req.params.id);
  try {
    const metadata = await assertOwnership(req, res, req.params.id);
    if (!metadata) return;
    const inspect = await getContainerInspect(containerName);
    const oldImage = inspect.Config.Image;
    await healLegacyModelInContainer(containerName);
    await runCommand('docker', ['stop', containerName]);
    await runCommand('docker', ['rm', containerName]);
    await recreateContainerWithImage(containerName, inspect, oldImage);
    res.json({ success: true, message: 'Agent repaired successfully' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Repair failed' });
  }
});

router.post('/:id/reset-memory', async (req: Request, res: Response) => {
  const containerName = getContainerName(req.params.id);
  try {
    const metadata = await assertOwnership(req, res, req.params.id);
    if (!metadata) return;
    const mount = (await getContainerInspect(containerName)).Mounts.find((m) => m.Destination === '/home/node/.openclaw');
    if (!mount) { res.status(500).json({ error: 'Could not find data mount' }); return; }
    if (mount.Type === 'volume' && mount.Name) {
      const child = spawn('docker', ['exec', containerName, 'sh', '-lc', 'rm -rf /home/node/.openclaw/agents/*/memory /home/node/.openclaw/agents/*/identity 2>/dev/null || true']);
      await new Promise<void>((resolve, reject) => { child.on('close', (c) => c === 0 ? resolve() : reject(new Error('exec failed'))); child.on('error', reject); });
    } else if (mount.Type === 'bind' && mount.Source) {
      const child = spawn('sh', ['-lc', `rm -rf "${mount.Source}"/agents/*/memory "${mount.Source}"/agents/*/identity 2>/dev/null || true`]);
      await new Promise<void>((resolve, reject) => { child.on('close', (c) => c === 0 ? resolve() : reject(new Error('exec failed'))); child.on('error', reject); });
    }
    await runCommand('docker', ['restart', containerName]);
    res.json({ success: true, message: 'Memory reset successfully' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Reset failed' });
  }
});

// ---------------------------------------------------------------------------
// Agent Definitions (Phase 2 — markdown + YAML frontmatter)
// ---------------------------------------------------------------------------

import { loadAllAgents, toMeta, parseAgentDefinition } from '../lib/agents';

// GET /api/agents/definitions — list all available agent definitions
router.get('/definitions', async (req: Request, res: Response) => {
  try {
    const projectDir = req.query.projectDir as string | undefined;
    const agents = loadAllAgents(projectDir);
    res.json({ agents: agents.map(toMeta), total: agents.length });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load definitions' });
  }
});

// GET /api/agents/definitions/:name — get a specific agent definition
router.get('/definitions/:name', async (req: Request, res: Response) => {
  try {
    const agents = loadAllAgents();
    const agent = agents.find(a => a.name === req.params.name);
    if (!agent) {
      return res.status(404).json({ error: 'Agent definition not found' });
    }
    res.json(agent);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load definition' });
  }
});

// POST /api/agents/definitions — validate and preview an agent definition
router.post('/definitions', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Missing content (markdown with YAML frontmatter)' });
    }
    const tmpPath = `/tmp/agent-def-${Date.now()}.md`;
    const fsMod = await import('fs');
    fsMod.writeFileSync(tmpPath, content);
    let def;
    try {
      def = parseAgentDefinition(tmpPath);
    } finally {
      fsMod.unlinkSync(tmpPath);
    }
    if (!def) {
      return res.status(400).json({ error: 'Invalid agent definition format' });
    }
    res.json({ valid: true, definition: toMeta(def), full: def });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Validation failed' });
  }
});

export default router;
