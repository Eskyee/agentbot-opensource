#!/bin/sh
# OpenClaw Gateway Entrypoint for Railway
set -e

GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(openssl rand -hex 16)}"
LISTEN_PORT="${PORT:-8080}"

mkdir -p /home/node/.openclaw

cat > /home/node/.openclaw/openclaw.json << CONFIG
{
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
        "primary": "openrouter/xiaomi/mimo-v2-pro"
      }
    }
  }
}
CONFIG

echo "Gateway token: ${GATEWAY_TOKEN}"
echo "Listening on port: ${LISTEN_PORT}"
exec openclaw gateway --port "${LISTEN_PORT}"
