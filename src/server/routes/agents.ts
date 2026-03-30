import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';
const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';

// --- Types ---

type AgentMetadata = {
  agentId: string;
  createdAt: string;
  plan: string;
  ownerEmail?: string;
  aiProvider?: string;
  port?: number;
  subdomain?: string;
  status?: string;
  config?: Record<string, unknown>;
  gatewayToken?: string;
};

// --- Helpers ---

const sanitizeAgentId = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');
const agentFilePath = (agentId: string): string =>
  path.join(DATA_DIR, 'agents', `${sanitizeAgentId(agentId)}.json`);

const readAgentMetadata = async (agentId: string): Promise<AgentMetadata | null> => {
  try { return JSON.parse(await fs.readFile(agentFilePath(agentId), 'utf8')); }
  catch { return null; }
};

const writeAgentMetadata = async (agent: AgentMetadata): Promise<void> => {
  await fs.writeFile(agentFilePath(agent.agentId), JSON.stringify(agent, null, 2));
};

// --- Routes ---

// List all agents
router.get('/', async (_req: Request, res: Response) => {
  try {
    const agentsDir = path.join(DATA_DIR, 'agents');
    await fs.mkdir(agentsDir, { recursive: true });
    const files = await fs.readdir(agentsDir);
    const agents = await Promise.all(
      files.filter(f => f.endsWith('.json')).map(async (f) => {
        const data = JSON.parse(await fs.readFile(path.join(agentsDir, f), 'utf8'));
        return {
          id: data.agentId,
          status: data.status || 'pending',
          created: data.createdAt,
          subdomain: data.subdomain,
        };
      })
    );
    res.json(agents);
  } catch { res.json([]); }
});

// Create agent
router.post('/', async (req: Request, res: Response) => {
  const { name, config } = req.body as { name?: string; config?: Record<string, unknown> };
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }

  try {
    await fs.mkdir(path.join(DATA_DIR, 'agents'), { recursive: true });
    const safeBase = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 20);
    const suffix = randomBytes(4).toString('hex');
    const agentId = `${safeBase}-${suffix}`;
    const subdomain = `${agentId}.${AGENTS_DOMAIN}`;

    const metadata: AgentMetadata = {
      agentId,
      createdAt: new Date().toISOString(),
      plan: (config?.plan as string) || 'free',
      aiProvider: (config?.aiProvider as string) || 'openrouter',
      subdomain,
      status: 'pending',
      config: config || {},
    };
    await writeAgentMetadata(metadata);

    res.status(201).json({
      id: agentId,
      name,
      agentId,
      status: 'pending',
      subdomain,
      createdAt: metadata.createdAt,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create agent' });
  }
});

// Get single agent
router.get('/:id', async (req: Request, res: Response) => {
  const metadata = await readAgentMetadata(req.params.id);
  if (!metadata) { res.status(404).json({ error: 'Agent not found' }); return; }
  res.json({
    id: metadata.agentId,
    status: metadata.status || 'pending',
    plan: metadata.plan,
    subdomain: metadata.subdomain,
    createdAt: metadata.createdAt,
  });
});

// Update agent
router.put('/:id', async (req: Request, res: Response) => {
  const metadata = await readAgentMetadata(req.params.id);
  if (!metadata) { res.status(404).json({ error: 'Agent not found' }); return; }
  const { plan, aiProvider, config } = req.body;
  if (plan) metadata.plan = plan;
  if (aiProvider) metadata.aiProvider = aiProvider;
  if (config) metadata.config = { ...(metadata.config || {}), ...config };
  await writeAgentMetadata(metadata);
  res.json({ id: metadata.agentId, plan: metadata.plan, subdomain: metadata.subdomain, message: 'Agent updated' });
});

// Delete agent
router.delete('/:id', async (req: Request, res: Response) => {
  const safeId = sanitizeAgentId(req.params.id);
  try { await fs.unlink(agentFilePath(safeId)); } catch { /* may not exist */ }
  res.json({ id: safeId, deleted: true });
});

export default router;
