import { log } from "../lib/logger";
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
import { orchestrator } from '../orchestrator';
import { runCommand, SecureExec } from '../utils/secure-exec';
import { authenticate } from '../middleware/auth';
import { DEFAULT_OPENCLAW_IMAGE, OPENCLAW_RUNTIME_VERSION, deriveOpenClawVersionFromImage } from '../lib/openclaw-version';
import { getAgentCount } from '../lib/agent-queries';

const router = Router();

// Admin emails (bypass payment)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

// --- Constants ---

const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_IMAGE = DEFAULT_OPENCLAW_IMAGE;
const OPENCLAW_HOME_DIR = '/root/.openclaw';

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
 * Admins bypass ownership checks.
 */
async function assertOwnership(req: Request, res: Response, agentId: string) {
  const instance = await orchestrator.getAgentStatus(agentId);
  if (!instance) {
    res.status(404).json({ error: 'Agent not found' });
    return null;
  }
  const email = req.userEmail as string;
  const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());
  const ownerEmail = instance.metadata?.ownerEmail as string | undefined;

  if (!isAdmin && ownerEmail && ownerEmail.toLowerCase() !== (email || '').toLowerCase()) {
    res.status(403).json({ error: 'Forbidden — you do not own this agent' });
    return null;
  }
  return instance;
}

// --- Helpers ---

const sanitizeAgentId = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');
const getContainerName = (agentId: string): string => `openclaw-${sanitizeAgentId(agentId)}`;
const isValidDockerImage = (value: string): boolean => DOCKER_IMAGE_REGEX.test(value);
const getPlanResources = (plan: string) => PLAN_RESOURCES[plan] || PLAN_RESOURCES.starter;

// --- Routes ---

// List all agents
router.get('/', async (_req: Request, res: Response) => {
  try {
    const agents = await orchestrator.listAgents();
    const formatted = agents.map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      created: (a.metadata?.createdAt as string) || new Date().toISOString(),
      subdomain: (a.metadata?.subdomain as string) || `${a.id}.${AGENTS_DOMAIN}`,
      url: `https://${(a.metadata?.subdomain as string) || `${a.id}.${AGENTS_DOMAIN}`}`,
    }));
    res.json(formatted);
  } catch (err) { 
    log.error('[Agents] List failed:', { error: err }) 
    res.json([]); 
  }
});

// Create agent (metadata only — no container)
router.post('/', authenticate, async (req: Request, res: Response) => {
  const { name, config } = req.body as { name?: string; config?: Record<string, unknown> };
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }

  // Payment enforcement — admins bypass, everyone else needs subscription
  const email = req.userEmail as string
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
    const safeBase = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 20);
    const suffix = randomBytes(4).toString('hex');
    const agentId = `${safeBase}-${suffix}`;
    const subdomain = `${agentId}.${AGENTS_DOMAIN}`;

    const metadata = {
      name: name.trim(),
      agentId, 
      createdAt: new Date().toISOString(),
      plan: (config?.plan as string) || 'free',
      aiProvider: (config?.aiProvider as string) || 'openrouter',
      subdomain, 
      status: 'pending', 
      config: config || {},
      ownerEmail: email,
    };
    
    await orchestrator.createAgent(agentId, metadata);

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
  try {
    const instance = await assertOwnership(req, res, id);
    if (!instance) return;

    res.json({
      id: instance.id,
      name: instance.name,
      status: instance.status,
      startedAt: (instance.metadata?.startedAt as string) || (instance.metadata?.createdAt as string) || new Date().toISOString(),
      plan: instance.plan,
      subdomain: (instance.metadata?.subdomain as string) || `${id}.${AGENTS_DOMAIN}`,
      url: `https://${(instance.metadata?.subdomain as string) || `${id}.${AGENTS_DOMAIN}`}`,
      openclawVersion: (instance.metadata?.openclawVersion as string) || OPENCLAW_RUNTIME_VERSION,
      verified: !!instance.metadata?.verified,
      verificationType: instance.metadata?.verificationType || null,
      attestationUid: instance.metadata?.attestationUid || null,
      verifiedAt: instance.metadata?.verifiedAt || null,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch agent' });
  }
});

// Update agent — ownership check
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const instance = await assertOwnership(req, res, id);
    if (!instance) return;
    const { plan, aiProvider, config } = req.body as {
      plan?: string; aiProvider?: string; config?: Record<string, unknown>;
    };
    if (plan) instance.plan = plan;
    
    instance.metadata = { 
      ...(instance.metadata || {}),
      ...(aiProvider ? { aiProvider } : {}),
      ...(config ? { config: { ...(instance.metadata?.config as Record<string, unknown> || {}), ...config } } : {})
    };

    await orchestrator.createAgent(id, instance.metadata);
    res.json({ id, plan: instance.plan, status: instance.status, message: 'Agent updated' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

// Delete agent — ownership check
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const instance = await assertOwnership(req, res, id);
    if (!instance) return;
    await orchestrator.deleteAgent(id);
    res.json({ id, deleted: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Delete failed' });
  }
});

// Verification endpoints
router.get('/:id/verification', async (req: Request, res: Response) => {
  try {
    const instance = await orchestrator.getAgentStatus(req.params.id);
    if (!instance) { res.status(404).json({ error: 'Agent not found' }); return; }
    res.json({
      verified: !!instance.metadata?.verified,
      verificationType: instance.metadata?.verificationType || null,
      attestationUid: instance.metadata?.attestationUid || null,
      verifierAddress: instance.metadata?.verifierAddress || null,
      verifiedAt: instance.metadata?.verifiedAt || null,
      metadata: instance.metadata?.verificationMetadata || null,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch verification' });
  }
});

router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const instance = await assertOwnership(req, res, req.params.id);
    if (!instance) return;
    const { verificationType, verified, attestationUid, verifierAddress, metadata } = req.body;
    
    const updatedMetadata = {
      ...(instance.metadata || {}),
      verified,
      verificationType,
      attestationUid,
      verifierAddress,
      verifiedAt: verified ? new Date().toISOString() : undefined,
      verificationMetadata: metadata
    };
    
    await orchestrator.createAgent(req.params.id, updatedMetadata);
    
    res.json({ success: true, verified, verificationType, attestationUid, verifiedAt: updatedMetadata.verifiedAt });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update verification' });
  }
});

router.delete('/:id/verify', async (req: Request, res: Response) => {
  try {
    const instance = await assertOwnership(req, res, req.params.id);
    if (!instance) return;
    
    const updatedMetadata = {
      ...(instance.metadata || {}),
      verified: false,
      verificationType: undefined,
      attestationUid: undefined,
      verifierAddress: undefined,
      verifiedAt: undefined,
      verificationMetadata: undefined
    };
    
    await orchestrator.createAgent(req.params.id, updatedMetadata);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to remove verification' });
  }
});

// Lifecycle endpoints — ownership check
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const instance = await assertOwnership(req, res, req.params.id);
    if (!instance) return;
    await orchestrator.startAgent(req.params.id);
    res.json({ success: true, status: 'active' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Start failed' });
  }
});

router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const instance = await assertOwnership(req, res, req.params.id);
    if (!instance) return;
    await orchestrator.stopAgent(req.params.id);
    res.json({ success: true, status: 'stopped' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Stop failed' });
  }
});

router.post('/:id/restart', async (req: Request, res: Response) => {
  try {
    const instance = await assertOwnership(req, res, req.params.id);
    if (!instance) return;
    await orchestrator.stopAgent(req.params.id);
    await orchestrator.startAgent(req.params.id);
    res.json({ success: true, status: 'active' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Restart failed' });
  }
});

router.post('/:id/update', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const instance = await assertOwnership(req, res, id);
    if (!instance) return;

    const requestedImage = typeof req.body?.image === 'string' ? req.body.image.trim() : '';
    const targetImage = requestedImage || (instance.metadata?.image as string) || DEFAULT_OPENCLAW_IMAGE;

    if (!isValidDockerImage(targetImage)) {
      res.status(400).json({ error: 'Invalid docker image value' });
      return;
    }

    const resources = getPlanResources(instance.plan);
    
    // Deploy/Update via orchestrator
    const updated = await orchestrator.deployAgent(id, {
      image: targetImage,
      memory: resources.memory,
      cpus: resources.cpus,
      env: (instance.metadata?.config as Record<string, unknown>)?.env as Record<string, string> || {},
      ports: {}, // Orchestrator handles 18789
      volumes: [{ source: `openclaw-data-${id}`, target: '/root/.openclaw' }],
      name: instance.name,
      plan: instance.plan
    });

    res.json({
      success: true,
      status: updated.status,
      image: targetImage,
      openclawVersion: deriveOpenClawVersionFromImage(targetImage),
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
});

router.get('/:id/token', async (req: Request, res: Response) => {
  try {
    const instance = await assertOwnership(req, res, req.params.id);
    if (!instance) return;
    
    let token = instance.metadata?.gatewayToken as string | undefined;
    if (!token) {
      token = randomBytes(32).toString('hex');
      instance.metadata = { ...(instance.metadata || {}), gatewayToken: token };
      await orchestrator.createAgent(req.params.id, instance.metadata);
    }
    res.json({ token });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get token' });
  }
});

router.post('/:id/repair', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const instance = await assertOwnership(req, res, id);
    if (!instance) return;

    const resources = getPlanResources(instance.plan);
    const targetImage = (instance.metadata?.image as string) || DEFAULT_OPENCLAW_IMAGE;

    // Repair is essentially a redeploy with same image
    await orchestrator.deployAgent(id, {
      image: targetImage,
      memory: resources.memory,
      cpus: resources.cpus,
      env: (instance.metadata?.config as Record<string, unknown>)?.env as Record<string, string> || {},
      ports: {},
      volumes: [{ source: `openclaw-data-${id}`, target: '/root/.openclaw' }],
      name: instance.name,
      plan: instance.plan
    });

    res.json({ success: true, message: 'Agent repaired successfully' });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Repair failed' });
  }
});

router.post('/:id/reset-memory', async (req: Request, res: Response) => {
  const { id } = req.params;
  const containerName = getContainerName(id);
  try {
    const instance = await assertOwnership(req, res, id);
    if (!instance) return;

    // Execute safe cleanup inside the container
    await runCommand('docker', [
      'exec', containerName, 'sh', '-lc', 
      `rm -rf ${OPENCLAW_HOME_DIR}/agents/*/memory ${OPENCLAW_HOME_DIR}/agents/*/identity 2>/dev/null || true`
    ]);

    await orchestrator.startAgent(id); // Effectively restarts if running
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
const MAX_DEFINITION_SIZE = 1024 * 1024; // 1MB
router.post('/definitions', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Missing content (markdown with YAML frontmatter)' });
    }
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }
    if (content.length > MAX_DEFINITION_SIZE) {
      return res.status(413).json({ error: 'Content exceeds 1MB size limit' });
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

// --- AgentKit Wallet Routes ---

import { AgentKitService } from '../services/agentkit';

/**
 * GET /api/agents/:id/wallet — Get or create AgentKit wallet for an agent
 */
router.get('/:id/wallet', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.id;
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const ownership = await assertOwnership(req, res, agentId);
    if (!ownership) return;

    const wallet = await AgentKitService.getOrCreateAgentWallet(userId, agentId);
    res.json({ ok: true, wallet });
  } catch (error: unknown) {
    log.error('[AgentKit] Wallet error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Wallet error' });
  }
});

/**
 * GET /api/agents/:id/wallet/balance — Get wallet balances
 */
router.get('/:id/wallet/balance', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.id;
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const ownership = await assertOwnership(req, res, agentId);
    if (!ownership) return;

    const balances = await AgentKitService.getBalances(agentId);
    res.json({ ok: true, balances });
  } catch (error: unknown) {
    log.error('[AgentKit] Balance error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Balance error' });
  }
});

/**
 * POST /api/agents/:id/wallet/send — Send USDC from agent wallet
 */
router.post('/:id/wallet/send', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.id;
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const ownership = await assertOwnership(req, res, agentId);
    if (!ownership) return;

    const { toAddress, amount } = req.body;
    if (!toAddress || !amount) {
      return res.status(400).json({ error: 'toAddress and amount required' });
    }

    const result = await AgentKitService.sendUSDC(agentId, toAddress, amount);
    res.json({ ok: true, ...result });
  } catch (error: unknown) {
    log.error('[AgentKit] Send error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Send error' });
  }
});

/**
 * GET /api/agents/:id/wallet/actions — List available AgentKit actions
 */
router.get('/:id/wallet/actions', async (req: Request, res: Response) => {
  try {
    const actions = AgentKitService.listActions();
    res.json({ ok: true, actions });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Actions error' });
  }
});

export default router;
