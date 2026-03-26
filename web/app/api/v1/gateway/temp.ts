/**
 * Gateway configuration
 * Defines CORS, plugins, and default routing for the x402 gateway.
 */

interface PluginConfig {
  enabled: boolean;
  endpoint: string;
  auth?: boolean;
}

interface GatewayConfig {
  cors: {
    origin: string;
    methods: string[];
    headers: string[];
  };
  defaultPlugin: string;
  plugins: Record<string, PluginConfig>;
}

export const GATEWAY_CONFIG: GatewayConfig = {
  cors: {
    origin: process.env.GATEWAY_CORS_ORIGIN || 'https://agentbot.raveculture.xyz',
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Plugin-Id', 'Payment'],
  },
  defaultPlugin: 'agent',
  plugins: {
    agent: {
      enabled: true,
      endpoint: process.env.AGENT_ENDPOINT || 'http://127.0.0.1:3001',
    },
    'generate-text': {
      enabled: true,
      endpoint: process.env.AI_ENDPOINT || 'http://127.0.0.1:3001/api/ai',
    },
    tts: {
      enabled: true,
      endpoint: process.env.TTS_ENDPOINT || 'http://127.0.0.1:3001',
    },
    stt: {
      enabled: true,
      endpoint: process.env.STT_ENDPOINT || 'http://127.0.0.1:3001',
    },
  },
};
