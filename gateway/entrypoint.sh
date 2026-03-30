#!/bin/sh
# OpenClaw Gateway Entrypoint for Railway — Production Config
set -e

GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(openssl rand -hex 32)}"
LISTEN_PORT="${PORT:-8080}"
AGENTBOT_API_URL="${AGENTBOT_API_URL:-https://agentbot-prod-production.up.railway.app}"

mkdir -p /home/node/.openclaw

cat > /home/node/.openclaw/openclaw.json << CONFIG
{
  "env": {
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}"
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": ${LISTEN_PORT},
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}",
      "rateLimit": {
        "maxAttempts": 10,
        "windowMs": 60000,
        "lockoutMs": 300000
      }
    },
    "trustedProxies": ["127.0.0.1", "10.0.0.0/8", "100.64.0.0/10", "172.16.0.0/12", "192.168.0.0/16"],
    "controlUi": {
      "allowedOrigins": ["*"],
      "dangerouslyDisableDeviceAuth": true,
      "dangerouslyAllowHostHeaderOriginFallback": true
    },
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    },
    "reload": { "mode": "hybrid", "debounceMs": 300 }
  },
  "agents": {
    "defaults": {
      "workspace": "/home/node/.openclaw/workspace",
      "userTimezone": "Europe/London",
      "model": {
        "primary": "openrouter/xiaomi/mimo-v2-pro",
        "fallbacks": ["openrouter/anthropic/claude-sonnet-4", "openrouter/google/gemini-2.5-flash"]
      },
      "imageModel": {
        "primary": "openrouter/google/gemini-2.5-flash"
      },
      "models": {
        "openrouter/xiaomi/mimo-v2-pro": { "alias": "mimo" },
        "openrouter/anthropic/claude-sonnet-4": { "alias": "sonnet" },
        "openrouter/google/gemini-2.5-flash": { "alias": "gemini" }
      },
      "thinkingDefault": "low",
      "verboseDefault": "off",
      "timeoutSeconds": 600,
      "mediaMaxMb": 5,
      "maxConcurrent": 3,
      "heartbeat": {
        "every": "30m",
        "lightContext": true,
        "isolatedSession": true,
        "target": "none"
      }
    }
  },
  "tools": {
    "profile": "coding",
    "deny": ["browser", "canvas"],
    "exec": {
      "backgroundMs": 10000,
      "timeoutSec": 1800
    },
    "loopDetection": {
      "enabled": true,
      "historySize": 30,
      "warningThreshold": 10,
      "criticalThreshold": 20
    },
    "web": {
      "search": { "enabled": true },
      "fetch": { "enabled": true, "maxChars": 50000 }
    }
  },
  "session": {
    "scope": "per-sender",
    "reset": { "mode": "daily", "atHour": 4 },
    "maintenance": {
      "mode": "warn",
      "pruneAfter": "30d",
      "maxEntries": 500
    }
  },
  "channels": {
    "telegram": { "enabled": false, "dmPolicy": "pairing" },
    "discord": { "enabled": false, "dmPolicy": "pairing" },
    "whatsapp": { "enabled": false, "dmPolicy": "pairing" },
    "webchat": { "enabled": true }
  },
  "cron": {
    "enabled": true,
    "maxConcurrentRuns": 2,
    "sessionRetention": "24h"
  },
  "logging": {
    "level": "info",
    "consoleLevel": "info",
    "consoleStyle": "compact",
    "redactSensitive": "tools"
  }
}
CONFIG

# Create workspace directory
mkdir -p /home/node/.openclaw/workspace

# Lock down permissions
chmod 600 /home/node/.openclaw/openclaw.json
chmod 700 /home/node/.openclaw

echo "Gateway token: ${GATEWAY_TOKEN}"
echo "Listening on port: ${LISTEN_PORT}"
echo "API URL: ${AGENTBOT_API_URL}"
exec openclaw gateway --port "${LISTEN_PORT}"
