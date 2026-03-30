import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { authenticate } from '../middleware/auth';
import { createContainer } from '../lib/container-manager';
import type { PlanType } from '../lib/container-manager';
import { Pool } from 'pg';

/**
 * Provision Endpoint
 * Creates a new agent with streaming capabilities
 *
 * POST /api/provision
 * Input: { channelToken, plan, aiProvider }
 * Output: { success, userId, subdomain, url, streamKey, liveStreamId, ... }
 */

const router = Router();

// Admin emails (bypass payment)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const KILL_SWITCH = process.env.KILL_SWITCH === 'true';

// Plan limits
const PLAN_LIMITS: Record<string, { agents: number; paymentRequired: boolean }> = {
  solo: { agents: 1, paymentRequired: true },
  collective: { agents: 3, paymentRequired: true },
  label: { agents: 10, paymentRequired: true },
  network: { agents: 999999, paymentRequired: true }, // unlimited
};

// DB-backed agent count — survives restarts and horizontal scaling
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Returns the number of active agents for this email+plan combination from the DB. */
async function getAgentCount(email: string, plan: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM agent_registrations
     WHERE user_id = $1 AND status = 'active'`,
    [email]
  );
  return parseInt(result.rows[0]?.cnt ?? '0', 10);
}

// Streaming credentials generator
const generateStreamingCredentials = async () => {
  const STREAMING_API_KEY = process.env.STREAMING_API_KEY;
  const STREAMING_API_SECRET = process.env.STREAMING_API_SECRET;

  if (!STREAMING_API_KEY || !STREAMING_API_SECRET) {
    // Fallback to placeholder if streaming provider not configured
    return {
      streamKey: `sk-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
      liveStreamId: Math.random().toString(36).substring(2, 12),
      rtmpServer: 'rtmps://live.streaming.example.com/app',
      playbackUrl: `https://stream.example.com/${Math.random().toString(36).substring(2, 12)}/playlist.m3u8`,
    };
  }

  const auth = Buffer.from(`${STREAMING_API_KEY}:${STREAMING_API_SECRET}`).toString('base64');
  const response = await fetch('https://api.streaming.example.com/video/v1/live-streams', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playback_policy: ['public'],
      new_asset_settings: { playback_policy: ['public'] },
      metadata: { platform: 'agentbot' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Streaming API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const stream = data.data;

  return {
    streamKey: stream.stream_key,
    liveStreamId: stream.id,
    rtmpServer: 'rtmps://live.streaming.example.com/app',
    playbackUrl: `https://stream.example.com/${stream.playback_ids[0].id}/playlist.m3u8`,
  };
};

/**
 * POST /api/provision
 * Provisions a new agent with streaming capabilities
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      channelToken,
      channelUserId,
      aiProvider = 'openrouter',
      plan = 'free',
      email: bodyEmail,
      paymentSubscriptionId,
      autoProvision = false,
      agentType = 'creative',
    } = req.body;

    // Also check header for email (set by auth middleware)
    const email = bodyEmail || (req.headers['x-user-email'] as string);

    // Kill switch check
    if (KILL_SWITCH) {
      return res.status(503).json({
        success: false,
        error: 'Provisioning is temporarily disabled. Contact support.',
      });
    }

    // Validation — channel token required unless auto-provisioning
    if (!autoProvision && !channelToken) {
      return res.status(400).json({
        success: false,
        error: 'channelToken required',
      });
    }

    // Validate AI provider
    const validProviders = ['openrouter', 'gemini', 'groq', 'anthropic', 'openai'];
    if (!validProviders.includes(aiProvider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid aiProvider. Supported: ${validProviders.join(', ')}`,
      });
    }

    // Validate plan
    const validPlans = Object.keys(PLAN_LIMITS);
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: `Invalid plan. Supported: ${validPlans.join(', ')}`,
      });
    }

    const planConfig = PLAN_LIMITS[plan];

    // Payment enforcement — only admins bypass, everyone else pays
    if (planConfig.paymentRequired) {
      const isAdmin = email && ADMIN_EMAILS.includes(email);

      if (!isAdmin && !paymentSubscriptionId) {
        return res.status(402).json({
          success: false,
          error: 'Active subscription required. Subscribe at /pricing',
          code: 'PAYMENT_REQUIRED',
        });
      }
    }

    // Free plan: NO FREE TIER — everyone pays
    if (plan === 'free') {
      return res.status(402).json({
        success: false,
        error: 'No free tier. Choose a paid plan to get started.',
        code: 'PAYMENT_REQUIRED',
      });
    }

    // Enforce agent limits per plan — backed by DB so restarts don't reset counts
    if (email) {
      const currentCount = await getAgentCount(email, plan);
      if (currentCount >= planConfig.agents) {
        return res.status(402).json({
          success: false,
          error: `Agent limit reached. Your ${plan} plan allows ${planConfig.agents} agent${planConfig.agents > 1 ? 's' : ''}. Upgrade to add more.`,
          code: 'AGENT_LIMIT_REACHED',
          current: currentCount,
          limit: planConfig.agents,
        });
      }
    }

    // Generate cryptographically secure unique IDs
    const userId = randomBytes(6).toString('hex');
    const streamingCreds = await generateStreamingCredentials();
    const subdomain = `agent-${userId}.agents.yourdomain.com`;

    const response = {
      success: true,
      userId,
      agentId: userId,
      id: userId,
      aiProvider,
      aiProviderConfig: getAiProviderConfig(aiProvider),
      plan,
      streamKey: streamingCreds.streamKey,
      liveStreamId: streamingCreds.liveStreamId,
      rtmpServer: streamingCreds.rtmpServer,
      playbackUrl: streamingCreds.playbackUrl,
      subdomain,
      url: `https://${subdomain}`,
      hls: {
        playlistUrl: streamingCreds.playbackUrl,
      },
      rtmp: {
        server: streamingCreds.rtmpServer,
        key: streamingCreds.streamKey,
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: {
        streaming: {
          provider: 'streaming-provider',
          lowLatency: true,
          resolution: '1920x1080',
          bitrate: '5000k',
        },
      },
    };

    // Create Docker container for the agent
    let containerInfo = null;
    try {
      containerInfo = await createContainer(userId, plan as PlanType);
      console.log(`[Provision] Container created: ${JSON.stringify(containerInfo)}`);
    } catch (containerError: any) {
      console.error(`[Provision] Container creation failed: ${containerError.message}`);
      // Don't fail provisioning — agent can still use API-side processing
    }

    // Add container info to response
    if (containerInfo) {
      (response as any).container = {
        name: containerInfo.container,
        status: containerInfo.status,
        serviceId: containerInfo.serviceId,
        url: containerInfo.url,
        controlUiUrl: containerInfo.controlUiUrl,
      };
    }

    res.status(200).json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Provision failed';
    console.error('[Provision]', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * Get AI provider configuration
 */
function getAiProviderConfig(provider: string) {
  const configs: Record<string, Record<string, unknown>> = {
    openrouter: {
      model: 'openai/gpt-4o-mini',
      baseUrl: 'https://openrouter.ai/api/v1',
      requiresKey: true,
    },
    gemini: {
      model: 'gemini-2.0-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      requiresKey: true,
    },
    groq: {
      model: 'mixtral-8x7b-32768',
      baseUrl: 'https://api.groq.com/openai/v1',
      requiresKey: true,
    },
    anthropic: {
      model: 'claude-3-sonnet-20240229',
      baseUrl: 'https://api.anthropic.com/v1',
      requiresKey: true,
    },
    openai: {
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com/v1',
      requiresKey: true,
    },
  };
  return configs[provider] || configs.openrouter;
}

export default router;
