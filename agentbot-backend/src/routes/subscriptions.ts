import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { authenticate } from '../middleware/authenticate';
import { ensureDataDirs } from '../lib/docker';
import { log } from '../lib/logger';

const router = Router();
const DATA_DIR = process.env.DATA_DIR || '/opt/agentbot/data';

const PLAN_RESOURCES: Record<string, { memory: string; cpus: string }> = {
  solo: { memory: '2g', cpus: '1' },
  collective: { memory: '4g', cpus: '2' },
  label: { memory: '8g', cpus: '4' },
  network: { memory: '16g', cpus: '4' },
  starter: { memory: '2g', cpus: '1' },
  pro: { memory: '4g', cpus: '2' },
  scale: { memory: '8g', cpus: '4' },
  enterprise: { memory: '16g', cpus: '4' },
  white_glove: { memory: '32g', cpus: '8' },
};

router.post('/deploy', authenticate, async (req: Request, res: Response) => {
  const { tier, customerId, subscriptionId, stripeCustomerId } = req.body as { tier?: string; customerId?: string; subscriptionId?: string; stripeCustomerId?: string };

  if (!customerId && !stripeCustomerId) return res.status(400).json({ error: 'customerId is required' });
  if (!tier) return res.status(400).json({ error: 'tier is required' });

  const validTiers = Object.keys(PLAN_RESOURCES);
  if (!validTiers.includes(tier)) return res.status(400).json({ error: `Invalid tier. Valid tiers: ${validTiers.join(', ')}` });

  try {
    await ensureDataDirs(DATA_DIR);
    const id = (stripeCustomerId || customerId) as string;
    const subscriptionFile = path.join(DATA_DIR, 'subscriptions', `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    await fs.mkdir(path.join(DATA_DIR, 'subscriptions'), { recursive: true });
    await fs.writeFile(subscriptionFile, JSON.stringify({ customerId: id, subscriptionId: subscriptionId || null, tier, plan: tier, resources: PLAN_RESOURCES[tier], activatedAt: new Date().toISOString() }, null, 2));

    log.info('[Subscriptions] Tier activated', { tier, customerId: id, subscriptionId });
    res.json({ success: true, customerId: id, subscriptionId, tier, resources: PLAN_RESOURCES[tier] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Subscription activation failed';
    log.error('[Subscriptions] Deploy error', { message });
    res.status(500).json({ error: message });
  }
});

export default router;
