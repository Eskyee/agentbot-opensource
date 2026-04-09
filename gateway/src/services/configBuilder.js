/**
 * services/configBuilder.js
 *
 * Takes validated form data and produces a valid openclaw.json object.
 *
 * Design: each section is its own builder function, so adding a new
 * channel or feature is just adding a new function here — nothing else
 * in the codebase needs to change.
 */

/**
 * @param {object} formData — validated fields from the setup form
 * @returns {object} — openclaw.json config object
 */
export function buildOpenclaWConfig(formData) {
  const cfg = {};

  // ── Agent / Model ──────────────────────────────────────────────
  cfg.agents = buildAgentsSection(formData);

  // ── Channels ──────────────────────────────────────────────────
  const channels = {};

  if (formData.telegramBotToken) {
    channels.telegram = buildTelegramSection(formData);
  }
  if (formData.discordBotToken) {
    channels.discord = buildDiscordSection(formData);
  }
  if (formData.slackBotToken && formData.slackAppToken) {
    channels.slack = buildSlackSection(formData);
  }
  if (formData.googleChatServiceAccount) {
    channels.googlechat = buildGoogleChatSection(formData);
  }
  if (formData.mattermostUrl && formData.mattermostToken) {
    channels.mattermost = buildMattermostSection(formData);
  }

  if (Object.keys(channels).length > 0) {
    cfg.channels = channels;
  }

  // ── Custom provider configs (providers that need explicit models.providers entries) ──
  if (formData.provider === 'ollama' && formData.ollamaUrl) {
    cfg.models = buildOllamaSection(formData);
  } else if (formData.provider === 'minimax') {
    cfg.models = buildMinimaxSection();
  }

  // ── Gateway ────────────────────────────────────────────────────
  cfg.gateway = buildGatewaySection(formData);

  // ── Session ────────────────────────────────────────────────────
  if (formData.sessionScope) {
    cfg.session = buildSessionSection(formData);
  }

  // ── Env vars (API keys) ────────────────────────────────────────
  // We write these to ~/.openclaw/.env, not into the JSON,
  // to keep secrets out of the config file.
  // The JSON references them via ${VAR_NAME} substitution.

  return cfg;
}

/**
 * Provider → env var mapping.
 * The setup form sends a single provider + apiKey pair.
 * Ollama has no API key so it has no entry here.
 */
const PROVIDER_ENV_MAP = {
  anthropic:   'ANTHROPIC_API_KEY',
  openai:      'OPENAI_API_KEY',
  google:      'GEMINI_API_KEY',
  openrouter:  'OPENROUTER_API_KEY',
  groq:        'GROQ_API_KEY',
  moonshot:    'MOONSHOT_API_KEY',
  zai:         'ZAI_API_KEY',
  minimax:     'MINIMAX_API_KEY',
};

/**
 * Returns the env vars that should go in ~/.openclaw/.env
 * Separate from the JSON config so secrets aren't in openclaw.json.
 */
export function buildEnvVars(formData) {
  const env = {};
  const envKey = PROVIDER_ENV_MAP[formData.provider];
  if (envKey && formData.apiKey) {
    env[envKey] = formData.apiKey;
  }
  return env;
}

import { OPENCLAW_GATEWAY_TOKEN } from '../config/index.js';

// ─── Section builders ──────────────────────────────────────────────

const PROVIDER_DEFAULT_MODEL = {
  anthropic:  'anthropic/claude-opus-4-6',
  openai:     'openai/gpt-5.4',
  google:     'google/gemini-2.5-pro',
  openrouter: 'openrouter/auto',
  groq:       'groq/llama-3.3-70b-versatile',
  moonshot:   'moonshot/kimi-k2.5',
  zai:        'zai/glm-4.5',
  minimax:    'minimax/MiniMax-M2.7',
  // ollama: no default — user must specify their pulled model
};

function buildAgentsSection(formData) {
  // For Ollama the user must provide the model (validated before we get here)
  const model = formData.model || PROVIDER_DEFAULT_MODEL[formData.provider];
  const workspace = '/data/.openclaw/workspace';

  return {
    defaults: {
      model: {
        primary: model,
        ...(formData.fallbackModel ? { fallbacks: [formData.fallbackModel] } : {}),
      },
      workspace,
    },
  };
}

function buildGatewaySection(formData) {
  const section = {
    // Required: tells openclaw this is a self-hosted local deployment
    mode: 'local',
    // Always loopback — our Express wrapper is the public face
    bind: 'loopback',
    port: 18789,
    reload: { mode: 'hybrid' },
  };

  // Gateway token — written to config so `openclaw tui` can read it.
  // Auth mode is passed as CLI flag to `gateway run` (gatewayManager.js);
  // don't set `mode` here to avoid conflicts.
  if (OPENCLAW_GATEWAY_TOKEN) {
    section.auth = {
      token: OPENCLAW_GATEWAY_TOKEN,
    };
  }

  // Trust our Express wrapper on loopback — fixes "Proxy headers from untrusted address" warning
  // and restores local client detection for WebSocket connections
  section.trustedProxies = ['127.0.0.1', '::1'];

  // Allow the wrapper's origin to access the Control UI.
  // allowInsecureAuth lets the gateway accept token-based auth from the
  // proxy without requiring device pairing for browser sessions.
  section.controlUi = {
    allowedOrigins: ['*'],
    allowInsecureAuth: true,
  };

  return section;
}

function buildTelegramSection(formData) {
  return {
    botToken: formData.telegramBotToken,
    dmPolicy: formData.telegramDmPolicy || 'pairing',
    ...(formData.telegramAllowFrom
      ? { allowFrom: parseAllowFrom(formData.telegramAllowFrom) }
      : {}),
    ...(formData.telegramWebhookUrl
      ? { webhookUrl: formData.telegramWebhookUrl }
      : {}),
  };
}

function buildDiscordSection(formData) {
  return {
    token: formData.discordBotToken,
    dmPolicy: formData.discordDmPolicy || 'pairing',
    ...(formData.discordAllowFrom
      ? { allowFrom: parseAllowFrom(formData.discordAllowFrom) }
      : {}),
  };
}

function buildSlackSection(formData) {
  return {
    botToken: formData.slackBotToken,
    appToken: formData.slackAppToken,
    dmPolicy: formData.slackDmPolicy || 'pairing',
  };
}

function buildGoogleChatSection(formData) {
  return {
    serviceAccount: formData.googleChatServiceAccount,
  };
}

function buildMattermostSection(formData) {
  return {
    url: formData.mattermostUrl,
    token: formData.mattermostToken,
    ...(formData.mattermostTeam ? { team: formData.mattermostTeam } : {}),
  };
}

function buildSessionSection(formData) {
  return {
    dmScope: formData.sessionScope || 'per-channel-peer',
    reset: formData.sessionResetMode
      ? {
          mode: formData.sessionResetMode,
          ...(formData.sessionResetHour
            ? { atHour: parseInt(formData.sessionResetHour, 10) }
            : {}),
        }
      : undefined,
  };
}

function buildMinimaxSection() {
  return {
    providers: {
      minimax: {
        baseUrl: 'https://api.minimax.io/anthropic',
        api: 'anthropic-messages',
        apiKey: '${MINIMAX_API_KEY}',
      },
    },
  };
}

function buildOllamaSection(formData) {
  // Extract the bare model ID from "ollama/deepseek-r1:1.5b" → "deepseek-r1:1.5b"
  const rawModel = formData.model || '';
  const modelId = rawModel.startsWith('ollama/') ? rawModel.slice(7) : rawModel;

  return {
    providers: {
      ollama: {
        baseUrl: formData.ollamaUrl,
        apiKey: 'ollama-local',
        api: 'ollama',
        // When explicitly defining the provider, the models array is required
        // (auto-discovery is skipped for explicit configs)
        models: [
          {
            id: modelId,
            name: modelId,
            reasoning: false,
            input: ['text'],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 8192,
          },
        ],
      },
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function parseAllowFrom(raw) {
  if (!raw) return undefined;
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}