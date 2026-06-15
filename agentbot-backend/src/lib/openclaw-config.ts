import { randomBytes } from 'crypto';

const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'xiaomi/mimo-v2.5-pro';
const MIMO_API_KEY = process.env.MIMO_API_KEY || '';
const MIMO_BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1';
const OPENCLAW_HOME_DIR = '/root/.openclaw';
const OPENCLAW_WORKSPACE_DIR = `${OPENCLAW_HOME_DIR}/workspace`;

/**
 * Builds the runtime openclaw.json config for a fresh agent container.
 *
 * Resolves the primary/fallback model from `aiProvider`, wires per-channel
 * settings (telegram/discord/whatsapp), generates a unique gateway auth
 * token, and selects the tool profile based on `plan`.
 */
export const createOpenClawConfig = (
  telegramToken: string,
  aiProvider: string,
  ownerIds?: string[],
  discordToken?: string,
  whatsappEnabled?: boolean,
  userTimezone?: string,
  plan?: string,
): Record<string, unknown> => {
  let model = DEFAULT_MODEL;
  let fallbacks = ['xiaomi/mimo-v2.5', 'openai/gpt-4o-mini'];
  const provider = aiProvider || 'xiaomi';

  if (provider === 'xiaomi' || provider === 'mimo') {
    model = 'xiaomi/mimo-v2.5-pro';
    fallbacks = ['xiaomi/mimo-v2.5', 'xiaomi/mimo-v2.5'];
  } else if (provider === 'gemini' || provider === 'google') {
    model = 'google/gemini-2.0-flash';
    fallbacks = ['xiaomi/mimo-v2.5-pro', 'openrouter/anthropic/claude-sonnet-4-5'];
  } else if (provider === 'groq') {
    model = 'groq/gemma2-9b-it';
    fallbacks = ['xiaomi/mimo-v2.5', 'openai/gpt-4o-mini'];
  } else if (provider === 'anthropic') {
    model = 'anthropic/claude-sonnet-4-5';
    fallbacks = ['xiaomi/mimo-v2.5-pro', 'openai/gpt-4o'];
  } else if (provider === 'openai') {
    model = 'openai/gpt-4o';
    fallbacks = ['xiaomi/mimo-v2.5', 'openai/gpt-4o-mini'];
  } else if (provider === 'openrouter') {
    model = 'moonshotai/kimi-k2.5';
    fallbacks = ['xiaomi/mimo-v2.5-pro', 'openrouter/openai/gpt-4o-mini'];
  } else {
    throw new Error(`Unsupported aiProvider: ${provider}`);
  }

  // Generate unique gateway auth token per agent
  const gatewayToken = randomBytes(24).toString('hex');

  // Tool profile per plan — solo gets messaging, others get coding
  const toolProfile = (plan === 'solo') ? 'messaging' : 'coding';

  const channels: Record<string, unknown> = {
    defaults: {
      groupPolicy: 'allowlist',
      heartbeat: { showOk: false, showAlerts: true, useIndicator: true },
    },
  };

  // Telegram channel
  if (telegramToken) {
    channels.telegram = {
      enabled: true,
      botToken: telegramToken,
      dmPolicy: ownerIds && ownerIds.length > 0 ? 'allowlist' : 'pairing',
      allowFrom: ownerIds || [],
      groups: { '*': { requireMention: true } },
      historyLimit: 50,
      replyToMode: 'first',
      streaming: 'partial',
      retry: { attempts: 3, minDelayMs: 400, maxDelayMs: 30000, jitter: 0.1 },
    };
  }

  // Discord channel
  if (discordToken) {
    channels.discord = {
      enabled: true,
      token: discordToken,
      dmPolicy: ownerIds && ownerIds.length > 0 ? 'allowlist' : 'pairing',
      allowFrom: ownerIds || [],
      dm: { enabled: true, groupEnabled: false },
      guilds: {},
      historyLimit: 20,
      streaming: 'partial',
      retry: { attempts: 3, minDelayMs: 500, maxDelayMs: 30000, jitter: 0.1 },
    };
  }

  // WhatsApp channel
  if (whatsappEnabled) {
    channels.whatsapp = {
      dmPolicy: ownerIds && ownerIds.length > 0 ? 'allowlist' : 'pairing',
      allowFrom: ownerIds || [],
      groups: { '*': { requireMention: true } },
      sendReadReceipts: true,
    };
  }

  const config: Record<string, unknown> = {
    agents: {
      defaults: {
        workspace: OPENCLAW_WORKSPACE_DIR,
        model: { primary: model, fallbacks },
        imageMaxDimensionPx: 1200,
        userTimezone: userTimezone || 'Europe/London',
        timeFormat: '24h',
        groupChat: {
          mentionPatterns: ['@agent', 'agent'],
        },
        compaction: {
          maxMessages: 200,
          keepLastN: 20,
        },
        heartbeat: {
          every: '30m',
        },
        skipBootstrap: false,
        bootstrapMaxChars: 4000,
      },
    },
    channels,
    update: {
      channel: 'stable',
      auto: {
        enabled: true,
        stableDelayHours: 6,
        stableJitterHours: 12,
        betaCheckIntervalHours: 1,
      },
    },
    gateway: {
      mode: 'local',
      port: 18789,
      bind: 'lan', // Required for Docker — listen on all interfaces, not just loopback
      auth: {
        mode: 'token',
        token: gatewayToken,
        allowTailscale: true,
        rateLimit: {
          maxAttempts: 10,
          windowMs: 60000,
          lockoutMs: 300000,
          exemptLoopback: true,
        },
      },
      channelHealthCheckMinutes: 5,
      channelStaleEventThresholdMinutes: 30,
      channelMaxRestartsPerHour: 10,
      controlUi: {
        enabled: true,
      },
    },
    tools: {
      profile: toolProfile,
      deny: ['browser', 'canvas'], // No browser/canvas in containers
      exec: {
        allowedCommands: [
          'ls', 'cat', 'grep', 'find', 'curl', 'wget', 'git', 'npm', 'node',
          'python3', 'pip', 'mkdir', 'cp', 'mv', 'rm', 'echo', 'date', 'whoami',
          'chmod', 'chown', 'touch', 'head', 'tail', 'wc', 'sort', 'uniq',
          'awk', 'sed', 'tar', 'zip', 'unzip', 'docker', 'ps', 'df', 'du',
        ],
        allowedPaths: [
          OPENCLAW_WORKSPACE_DIR,
          '/tmp',
          '/root',
        ],
        denyPaths: [
          '/etc/shadow',
          '/etc/passwd',
          '/proc',
          '/sys',
        ],
      },
      web: {
        maxChars: 50000,
      },
      loopDetection: {
        maxIterations: 20,
        windowMinutes: 5,
      },
    },
    session: {
      maxTokens: 100000,
      compaction: {
        strategy: 'auto',
        triggerAtPercent: 80,
      },
    },
    plugins: {
      entries: {},
    },
  };

  // Add MiMo provider if API key is available
  if (MIMO_API_KEY) {
    (config as Record<string, unknown>).models = {
      providers: {
        xiaomi: {
          baseUrl: MIMO_BASE_URL,
          apiKey: MIMO_API_KEY,
          api: 'openai-completions',
          headers: { 'api-key': MIMO_API_KEY },
          models: [
            { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', api: 'openai-completions', contextWindow: 1048576, reasoning: true, input: ['text'], maxTokens: 32000, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } },
            { id: 'mimo-v2.5', name: 'MiMo-V2.5', api: 'openai-completions', contextWindow: 262144, reasoning: true, input: ['text', 'image'], maxTokens: 32000, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } },
            { id: 'mimo-v2.5-pro', name: 'MiMo-V2-Pro', api: 'openai-completions', contextWindow: 1048576, reasoning: true, input: ['text'], maxTokens: 32000, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } },
            { id: 'mimo-v2.5', name: 'MiMo-V2-Omni', api: 'openai-completions', contextWindow: 262144, reasoning: true, input: ['text', 'image'], maxTokens: 32000, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } },
          ],
        },
      },
    };
  }

  // Enable plugins based on channels
  if (telegramToken) {
    (config.plugins as { entries: Record<string, unknown> }).entries.telegram = { enabled: true };
  }
  if (discordToken) {
    (config.plugins as { entries: Record<string, unknown> }).entries.discord = { enabled: true };
  }

  return config;
};
