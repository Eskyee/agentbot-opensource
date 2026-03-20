import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

/**
 * BASEFM Provision Endpoint
 * Creates a new DJ agent with Telegram channel and Mux streaming credentials
 * 
 * POST /api/provision
 * Input: { telegramToken, plan, aiProvider }
 * Output: { success, userId, subdomain, url, streamKey, liveStreamId, ... }
 */

const router = Router();

// Admin/tester emails (bypass Stripe)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'djescaba@icloud.com,eskyjunglelab@gmail.com').split(',');
const TESTER_EMAILS = (process.env.TESTER_EMAILS || '').split(',').filter(Boolean);
const KILL_SWITCH = process.env.KILL_SWITCH === 'true';

// Plan limits — NO FREE TIER
const PLAN_LIMITS: Record<string, { agents: number; stripeRequired: boolean }> = {
  label: { agents: 1, stripeRequired: true },
  solo: { agents: 3, stripeRequired: true },
  collective: { agents: 10, stripeRequired: true },
  network: { agents: 100, stripeRequired: true },
};

// Simple in-memory Mux mock (in production, would use real Mux API)
const generateMuxCredentials = () => ({
  streamKey: `sk-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
  liveStreamId: Math.random().toString(36).substring(2, 12),
  rtmpServer: 'rtmps://live.mux.com/app',
  playbackUrl: `https://image.mux.com/${Math.random().toString(36).substring(2, 12)}/playlist.m3u8`,
});

/**
 * POST /api/provision
 * Provisions a new BASEFM agent with streaming capabilities
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      telegramToken,
      telegramUserId,
      discordBotToken,
      whatsappToken,
      aiProvider = 'openrouter',
      plan = 'free',
      email, // user email for admin/stripe check
      stripeSubscriptionId, // from Stripe checkout
    } = req.body;

    // Kill switch check
    if (KILL_SWITCH) {
      return res.status(503).json({
        success: false,
        error: 'Provisioning is temporarily disabled. Contact support.',
      });
    }

    // Validation
    if (!telegramToken && !discordBotToken && !whatsappToken) {
      return res.status(400).json({
        success: false,
        error: 'At least one channel token required (telegramToken, discordBotToken, or whatsappToken)',
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

    // Payment enforcement: non-free plans require Stripe or admin/tester status
    if (planConfig.stripeRequired) {
      const isAdmin = email && ADMIN_EMAILS.includes(email);
      const isTester = email && TESTER_EMAILS.includes(email);

      if (!isAdmin && !isTester && !stripeSubscriptionId) {
        return res.status(402).json({
          success: false,
          error: 'Payment required. Please subscribe via Stripe before creating an agent.',
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

    // Generate unique IDs
    const userId = Math.random().toString(36).substring(2, 12);
    const muxCreds = generateMuxCredentials();
    const subdomain = `dj-${userId}.agentbot.raveculture.xyz`;

    // In production, you would:
    // 1. Store agent config in database
    // 2. Create real Mux live stream
    // 3. Deploy Docker container via /api/deployments
    // 4. Set up monitoring and alerting
    // 5. Return full agent metadata

    const response = {
      success: true,
      userId,
      agentId: userId,
      id: userId,
      telegramToken,
      discordToken: discordBotToken,
      whatsappToken,
      aiProvider,
      aiProviderConfig: getAiProviderConfig(aiProvider),
      plan,
      streamKey: muxCreds.streamKey,
      liveStreamId: muxCreds.liveStreamId,
      rtmpServer: muxCreds.rtmpServer,
      playbackUrl: muxCreds.playbackUrl,
      subdomain,
      url: `https://${subdomain}`,
      hls: {
        playlistUrl: muxCreds.playbackUrl,
      },
      rtmp: {
        server: muxCreds.rtmpServer,
        key: muxCreds.streamKey,
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: {
        channels: {
          telegram: telegramToken ? 'enabled' : 'disabled',
          discord: discordBotToken ? 'enabled' : 'disabled',
          whatsapp: whatsappToken ? 'enabled' : 'disabled',
        },
        streaming: {
          provider: 'mux',
          lowLatency: true,
          resolution: '1920x1080',
          bitrate: '5000k',
        },
      },
    };

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
    minimax: {
      model: 'MiniMax/MiniMax-Text-01',
      baseUrl: 'https://api.minimax.chat/v1',
      requiresKey: true,
    },
  };
  return configs[provider] || configs.openrouter;
}

export default router;
