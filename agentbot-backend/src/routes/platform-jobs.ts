import { Router, Request, Response } from 'express';
import { enqueueGatewayChatJob, enqueueProvisionJob, getPlatformJob, getPlatformJobMetrics } from '../services/platform-jobs';

const router = Router();

router.post('/provision', async (req: Request, res: Response) => {
  const {
    userId,
    email,
    agentId,
    plan = 'solo',
    aiProvider = 'openrouter',
    agentType = 'creative',
    autoProvision = false,
    stripeSubscriptionId = null,
  } = req.body || {};

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }
  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({ error: 'agentId is required' });
  }

  try {
    const job = await enqueueProvisionJob({
      userId,
      email,
      agentId,
      plan,
      aiProvider,
      agentType,
      autoProvision,
      stripeSubscriptionId,
    });

    return res.status(202).json({
      success: true,
      queued: true,
      job,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to enqueue provision job';
    console.error('[PlatformJobs] Enqueue error:', message);
    return res.status(500).json({ error: message });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  const {
    userId,
    agentId,
    gatewayUrl,
    message,
    systemPrompt = null,
  } = req.body || {};

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({ error: 'agentId is required' });
  }
  if (!gatewayUrl || typeof gatewayUrl !== 'string') {
    return res.status(400).json({ error: 'gatewayUrl is required' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const job = await enqueueGatewayChatJob({
      userId,
      agentId,
      gatewayUrl,
      message,
      systemPrompt,
    });

    return res.status(202).json({
      success: true,
      queued: true,
      job,
    });
  } catch (error: unknown) {
    const messageText = error instanceof Error ? error.message : 'Failed to enqueue chat job';
    return res.status(500).json({ error: messageText });
  }
});

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getPlatformJobMetrics();
    return res.json(metrics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job metrics';
    return res.status(500).json({ error: message });
  }
});

router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const job = await getPlatformJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json({ job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job';
    return res.status(500).json({ error: message });
  }
});

export default router;
