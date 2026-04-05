#!/bin/sh
# OpenClaw Gateway Entrypoint for Railway — Official docs pattern
set -e

GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(openssl rand -hex 32)}"
LISTEN_PORT="${PORT:-8080}"
AGENTBOT_API_URL="${AGENTBOT_API_URL:-https://agentbot-backend-production.up.railway.app}"
CONTROL_UI_ORIGIN="${CONTROL_UI_ORIGIN:-https://agentbot.raveculture.xyz}"
SKIP_SERVICE_READINESS="${SKIP_SERVICE_READINESS:-false}"
SERVICE_HEALTH_URL="${SERVICE_HEALTH_URL:-${AGENTBOT_API_URL%/}/health}"
export SERVICE_HEALTH_URL

OPENCLAW_HOME="${HOME}/.openclaw"
mkdir -p "${OPENCLAW_HOME}"

cat > "${OPENCLAW_HOME}/openclaw.json" << CONFIG
{
  "env": {
    "GEMINI_API_KEY": "${GEMINI_API_KEY}",
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}"
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": ${LISTEN_PORT},
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    },
    "trustedProxies": ["127.0.0.1", "10.0.0.0/8", "100.64.0.0/10", "172.16.0.0/12", "192.168.0.0/16"],
    "controlUi": {
      "allowedOrigins": ["*"],
      "dangerouslyDisableDeviceAuth": true,
      "dangerouslyAllowHostHeaderOriginFallback": true
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-2.5-flash"
      }
    }
  }
}
CONFIG

echo "Gateway token: ${GATEWAY_TOKEN}"
echo "Listening on port: ${LISTEN_PORT}"

exec openclaw gateway --port "${LISTEN_PORT}"
