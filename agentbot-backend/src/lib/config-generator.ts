/**
 * OpenClaw Gateway Config Generator
 * Generates per-user OpenClaw configuration for agent containers.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = process.env.AGENTBOT_DATA_DIR || '/Users/raveculture/agentbot-data';

export interface AgentConfig {
  userId: string;
  plan: string;
  channels: {
    telegram?: string;
    discord?: string;
    whatsapp?: string;
  };
  aiProvider: string;
  aiProviderKey?: string;
  model?: string;
}

/**
 * Plan resource limits matching pricing tiers
 */
const PLAN_RESOURCES: Record<string, { memory: string; models: string[]; sessions: number }> = {
  solo: { memory: '64mb', models: ['openrouter/xiaomi/mimo-v2-pro', 'openrouter/anthropic/claude-sonnet-4'], sessions: 5 },
  collective: { memory: '128mb', models: ['openrouter/xiaomi/mimo-v2-pro', 'openrouter/anthropic/claude-sonnet-4', 'openrouter/google/gemini-2.5-flash'], sessions: 15 },
  label: { memory: '256mb', models: ['openrouter/xiaomi/mimo-v2-pro', 'openrouter/anthropic/claude-sonnet-4', 'openrouter/google/gemini-2.5-flash', 'openrouter/deepseek/deepseek-r1'], sessions: 50 },
  network: { memory: '512mb', models: ['openrouter/*'], sessions: 999 },
};

/**
 * Generate OpenClaw gateway config for a user
 */
export function generateConfig(config: AgentConfig): { config: object; authToken: string } {
  const plan = config.plan || 'solo';
  const resources = PLAN_RESOURCES[plan] || PLAN_RESOURCES.solo;
  const authToken = crypto.randomBytes(24).toString('hex');

  const openClawConfig: any = {
    auth: {
      token: authToken,
      method: 'token',
    },
    gateway: {
      port: 18789,
      bind: '0.0.0.0',
      // SECURITY: CORS must never be wildcard — restrict to the known dashboard origin.
      // Wildcard would allow any website to communicate with this agent's gateway.
      cors: {
        origin: process.env.GATEWAY_ALLOWED_ORIGIN || 'https://agentbot.raveculture.xyz',
        credentials: true,
      },
      controlUi: true,
    },
    models: {
      default: config.model || 'openrouter/xiaomi/mimo-v2-pro',
      fallbacks: ['openrouter/anthropic/claude-sonnet-4', 'openrouter/google/gemini-2.5-flash'],
      budget: {
        maxCostUsd: plan === 'solo' ? 2 : plan === 'collective' ? 5 : 10,
        period: 'monthly',
      },
    },
    session: {
      max: resources.sessions,
      timeoutMinutes: 60,
      persist: true,
    },
    compaction: {
      maxMessages: 50,
      keepLast: 10,
    },
    heartbeat: {
      intervalMinutes: 15,
    },
    timezone: 'Europe/London',
  };

  // Channel configuration
  if (config.channels.telegram) {
    openClawConfig.channels = openClawConfig.channels || {};
    openClawConfig.channels.telegram = {
      token: config.channels.telegram,
      mentionOnly: true,
    };
  }
  if (config.channels.discord) {
    openClawConfig.channels = openClawConfig.channels || {};
    openClawConfig.channels.discord = {
      token: config.channels.discord,
    };
  }
  if (config.channels.whatsapp) {
    openClawConfig.channels = openClawConfig.channels || {};
    openClawConfig.channels.whatsapp = {
      token: config.channels.whatsapp,
    };
  }

  // Tool configuration based on plan
  if (plan === 'solo') {
    openClawConfig.tools = { profile: 'messaging' };
  } else {
    openClawConfig.tools = {
      profile: 'coding',
      exec: {
        allow: ['ls', 'cat', 'head', 'tail', 'find', 'grep', 'wc', 'echo'],
      },
      deny: ['browser', 'canvas'],
    };
  }

  return { config: openClawConfig, authToken };
}

/**
 * Write config to user's data directory
 */
export function writeConfigToFile(config: AgentConfig): string {
  const { config: openClawConfig, authToken } = generateConfig(config);
  const userDir = path.join(DATA_DIR, config.userId, 'config');
  
  fs.mkdirSync(userDir, { recursive: true });
  fs.writeFileSync(
    path.join(userDir, 'openclaw.json'),
    JSON.stringify(openClawConfig, null, 2)
  );
  
  return authToken;
}

export default { generateConfig, writeConfigToFile };
