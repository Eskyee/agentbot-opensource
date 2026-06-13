import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getContainerName, containerStatus, sanitizeAgentId, ensureDataDirs } from '../lib/docker';
import { DEFAULT_OPENCLAW_IMAGE as OPENCLAW_IMAGE } from '../lib/openclaw-version';
import { readAgentMetadata, writeAgentMetadata } from '../lib/agent-metadata';
import { getNextPortAndAssign } from '../lib/ports';
import { createOpenClawConfig } from '../lib/openclaw-config';
import { runCommand, SecureExec } from '../utils/secure-exec';
import { OPENCLAW_RUNTIME_VERSION } from '../lib/openclaw-version';
import { log } from '../lib/logger';

const router = Router();

const AGENTS_DOMAIN = process.env.AGENTS_DOMAIN || 'agents.localhost';
const OPENCLAW_HOME_DIR = '/root/.openclaw';
const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';

// Deployer is injected from index.ts to avoid circular deps
let deployLimiter: any;
export const setDeployLimiter = (limiter: any) => { deployLimiter = limiter; };

router.post('/', authenticate, async (req: Request, res: Response) => {
  if (deployLimiter) deployLimiter(req, res, () => {});

  const { agentId, config } = req.body as {
    agentId?: string;
    config?: {
      telegramToken?: string;
      ownerIds?: string[];
      aiProvider?: string;
      apiKey?: string;
      plan?: string;
      tailscale?: { enabled?: boolean; mode?: 'serve' | 'funnel' | 'tailnet'; authKey?: string; hostname?: string; tags?: string[]; acceptRoutes?: boolean; password?: string; resetOnExit?: boolean };
    };
  };

  if (!agentId) return res.status(400).json({ error: 'agentId is required' });
  const safeAgentId = sanitizeAgentId(agentId);
  if (!safeAgentId) return res.status(400).json({ error: 'Invalid agentId' });
  if (!config?.telegramToken) return res.status(400).json({ error: 'telegramToken is required' });

  const containerName = getContainerName(safeAgentId);

  try {
    await ensureDataDirs(DATA_DIR);

    const existing = await containerStatus(containerName);
    if (existing?.status === 'active') {
      const metadata = await readAgentMetadata(DATA_DIR, safeAgentId);
      const subdomain = metadata?.subdomain || `${safeAgentId}.${AGENTS_DOMAIN}`;
      return res.status(200).json({ id: `deploy-${safeAgentId}`, agentId: safeAgentId, subdomain, url: `https://${subdomain}`, status: 'active', openclawVersion: OPENCLAW_RUNTIME_VERSION });
    }

    const openclawConfig = createOpenClawConfig(config.telegramToken, config.aiProvider || 'openrouter', config.ownerIds);
    const volumeName = `openclaw-data-${safeAgentId}`;
    await runCommand('docker', ['volume', 'create', volumeName]);

    const configBase64 = Buffer.from(JSON.stringify(openclawConfig, null, 2), 'utf8').toString('base64');
    await SecureExec.provisionConfig(volumeName, configBase64);

    const assignedPort = await getNextPortAndAssign(safeAgentId, DATA_DIR);

    try { await runCommand('docker', ['rm', '-f', containerName]); } catch { /* no-op */ }

    const provider = config.aiProvider || 'openrouter';
    const providedKey = (config.apiKey || '').trim();
    const envArgs: string[] = [];
    const addEnvIfKeyExists = (envName: string) => {
      const key = providedKey || (process.env[envName] || '').trim();
      if (key) envArgs.push('-e', `${envName}=${key}`);
    };

    if (provider === 'gemini' || provider === 'google') addEnvIfKeyExists('GEMINI_API_KEY');
    else if (provider === 'groq') addEnvIfKeyExists('GROQ_API_KEY');
    else if (provider === 'anthropic') addEnvIfKeyExists('ANTHROPIC_API_KEY');
    else if (provider === 'openai') addEnvIfKeyExists('OPENAI_API_KEY');
    else if (provider === 'openrouter') addEnvIfKeyExists('OPENROUTER_API_KEY');

    if (config.tailscale?.enabled) {
      const authKey = config.tailscale.authKey?.trim();
      if (!authKey) return res.status(400).json({ error: 'tailscale.authKey is required when Tailscale is enabled' });
      const tailscaleMode = config.tailscale.mode === 'funnel' || config.tailscale.mode === 'tailnet' ? config.tailscale.mode : 'serve';
      const tailscalePassword = config.tailscale.password?.trim();
      if (tailscaleMode === 'funnel' && !tailscalePassword) return res.status(400).json({ error: 'tailscale.password is required when Tailscale Funnel is enabled' });
      envArgs.push('-e', `OPENCLAW_TAILSCALE_MODE=${tailscaleMode}`, '-e', `TAILSCALE_AUTHKEY=${authKey}`, '-e', `TAILSCALE_HOSTNAME=${config.tailscale.hostname || `agentbot-${safeAgentId}`}`, '-e', `TAILSCALE_ACCEPT_ROUTES=${config.tailscale.acceptRoutes !== false}`, '-e', `OPENCLAW_GATEWAY_BIND=${tailscaleMode === 'tailnet' ? 'tailnet' : 'loopback'}`);
      if (config.tailscale.resetOnExit === true) envArgs.push('-e', 'OPENCLAW_TAILSCALE_RESET_ON_EXIT=true');
      if (tailscalePassword) envArgs.push('-e', `OPENCLAW_GATEWAY_PASSWORD=${tailscalePassword}`);
      if (Array.isArray(config.tailscale.tags) && config.tailscale.tags.length > 0) envArgs.push('-e', `TAILSCALE_TAGS=${config.tailscale.tags.map((t) => t.trim()).filter(Boolean).join(',')}`);
    }

    const resources = (await import('../index')).getPlanResources(config.plan || 'free');

    await runCommand('docker', [
      'run', '-d', '--name', containerName, '--restart', 'unless-stopped',
      '--memory', resources.memory, '--cpus', resources.cpus,
      ...envArgs, '-v', `${volumeName}:${OPENCLAW_HOME_DIR}`,
      '-p', `${assignedPort}:18789`, '-p', `${assignedPort + 2}:18791`, OPENCLAW_IMAGE,
    ]);

    const subdomain = `${safeAgentId}.${AGENTS_DOMAIN}`;
    await writeAgentMetadata(DATA_DIR, { agentId: safeAgentId, createdAt: new Date().toISOString(), plan: config.plan || 'free', aiProvider: config.aiProvider || 'openrouter', port: assignedPort, subdomain });

    res.status(201).json({ id: `deploy-${safeAgentId}`, agentId: safeAgentId, subdomain, url: `https://${subdomain}`, status: 'active', openclawVersion: OPENCLAW_RUNTIME_VERSION });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Deployment failed';
    res.status(500).json({ error: message });
  }
});

export default router;
