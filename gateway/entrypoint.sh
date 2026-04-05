#!/bin/sh
# OpenClaw Gateway Entrypoint for Railway — Template-compatible
# Pre-seeds config + env so server.js auto-launches the gateway
set -e

GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(openssl rand -hex 32)}"
DATA_DIR="${OPENCLAW_DATA_DIR:-/data}"
OPENCLAW_HOME="${DATA_DIR}/.openclaw"

mkdir -p "${OPENCLAW_HOME}"

# Write openclaw.json — server.js configBuilder-compatible format
# Gateway binds to loopback (server.js proxy is the public face)
cat > "${OPENCLAW_HOME}/openclaw.json" << CONFIG
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "google/gemini-2.5-flash"
      },
      "workspace": "${DATA_DIR}/.openclaw/workspace"
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "loopback",
    "port": 18789,
    "reload": { "mode": "hybrid" },
    "auth": {
      "token": "${GATEWAY_TOKEN}"
    },
    "trustedProxies": ["127.0.0.1", "::1"],
    "controlUi": {
      "allowedOrigins": ["*"],
      "allowInsecureAuth": true
    }
  }
}
CONFIG

# Write .env — API keys go here, not in openclaw.json
{
  [ -n "${GEMINI_API_KEY}" ] && echo "GEMINI_API_KEY=${GEMINI_API_KEY}"
  [ -n "${OPENROUTER_API_KEY}" ] && echo "OPENROUTER_API_KEY=${OPENROUTER_API_KEY}"
} > "${OPENCLAW_HOME}/.env"

mkdir -p "${OPENCLAW_HOME}/workspace"

echo "Gateway token: ${GATEWAY_TOKEN}"
echo "Config written to: ${OPENCLAW_HOME}/openclaw.json"
echo "Starting server..."

exec node src/server.js
