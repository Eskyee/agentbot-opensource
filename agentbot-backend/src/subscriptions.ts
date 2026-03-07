import { Router, Request, Response } from 'express';

const router = Router();

type DeploymentResponse = {
  id: string;
  agentId: string;
  subdomain: string;
  url: string;
  status: string;
  openclawVersion: string;
};

type AgentResponse = {
  id: string;
  status: string;
  startedAt: string;
  plan: string;
  subdomain: string;
  url: string;
  openclawVersion: string;
  verified?: boolean;
  verificationType?: string | null;
  attestationUid?: string | null;
  verifiedAt?: string | null;
};

// Authenticate middleware
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);
  if (token !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// POST /api/subscriptions/deploy
// Triggered by webhook when payment is successful
// Deploys a default agent with the purchased plan's resources
router.post('/deploy', authenticate, async (req: Request, res: Response) => {
  const { userId, plan, email, stripeSubscriptionId } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ error: 'userId and plan required' });
  }

  const validPlans = ['starter', 'pro', 'scale', 'enterprise', 'white_glove'];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    console.log(`[Subscriptions] Deploying ${plan} plan for user ${userId}`);

    // Create a default agent ID based on user ID
    const agentId = `agent-${userId.substring(0, 12)}`;
    
    // Get default Telegram token from environment or use placeholder
    // In production, this would be fetched from user config
    const telegramToken = process.env.DEFAULT_TELEGRAM_BOT_TOKEN || 'placeholder_token';
    
    if (!telegramToken || telegramToken === 'placeholder_token') {
      console.warn(`[Subscriptions] Warning: No Telegram token configured for user ${userId}`);
      // Continue anyway - agent will be created but won't work until token is added
    }

    // Call the existing deployments endpoint to actually deploy
    const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
    const deploymentRes = await fetch(`${baseUrl}/api/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        agentId,
        config: {
          telegramToken,
          plan,
          aiProvider: process.env.DEFAULT_AGENT_PROVIDER || 'openrouter'
        }
      })
    });

    if (!deploymentRes.ok) {
      const error = await deploymentRes.text();
      console.error(`[Subscriptions] Deployment failed: ${error}`);
      return res.status(500).json({
        error: 'Failed to deploy service',
        details: error
      });
    }

    const deployment = (await deploymentRes.json()) as DeploymentResponse;
    
    console.log(`[Subscriptions] ✓ Deployment successful for user ${userId}:`, {
      agentId,
      plan,
      url: deployment.url,
      status: deployment.status
    });

    return res.status(201).json({
      success: true,
      message: 'Deployment initiated',
      agentId,
      plan,
      deployment
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Subscriptions] Error deploying:`, message);
    return res.status(500).json({
      error: 'Deployment failed',
      message
    });
  }
});

// GET /api/subscriptions/status/:userId
// Check deployment status for a user
router.get('/status/:userId', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const agentId = `agent-${userId.substring(0, 12)}`;
    
    // Check status via deployments endpoint
    const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
    const statusRes = await fetch(
      `${baseUrl}/api/agents/${agentId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
        }
      }
    );

    if (!statusRes.ok) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = (await statusRes.json()) as AgentResponse;

    return res.json({
      userId,
      agentId,
      status: agent.status,
      url: agent.url,
      plan: agent.plan
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export default router;
