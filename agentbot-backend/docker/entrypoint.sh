#!/bin/sh
# Agentbot OpenClaw Agent Container Entrypoint (Official Image)
# Uses ghcr.io/openclaw/openclaw:latest
# Runs openclaw onboard --non-interactive for proper setup
set -e

USER_ID="${AGENTBOT_USER_ID:-unknown}"
PLAN="${AGENTBOT_PLAN:-solo}"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
AI_PROVIDER="${AGENTBOT_AI_PROVIDER:-anthropic}"
API_KEY="${AGENTBOT_API_KEY:-}"

echo "[$(date)] Starting Agentbot agent container..."
echo "  User: ${USER_ID}"
echo "  Plan: ${PLAN}"
echo "  Port: ${GATEWAY_PORT}"
echo "  Provider: ${AI_PROVIDER}"
echo "  OpenClaw: $(openclaw --version 2>/dev/null || echo 'unknown')"

# Performance: ensure compile cache directory exists
mkdir -p "${NODE_COMPILE_CACHE:-/var/tmp/openclaw-compile-cache}"

# Map provider to onboard auth flag
case "$AI_PROVIDER" in
  anthropic)
    AUTH_CHOICE="apiKey"
    KEY_FLAG="--anthropic-api-key"
    ;;
  openai)
    AUTH_CHOICE="openai-api-key"
    KEY_FLAG="--openai-api-key"
    ;;
  gemini)
    AUTH_CHOICE="gemini-api-key"
    KEY_FLAG="--gemini-api-key"
    ;;
  ollama)
    AUTH_CHOICE="ollama"
    KEY_FLAG=""
    ;;
  custom)
    AUTH_CHOICE="custom-api-key"
    KEY_FLAG="--custom-api-key"
    ;;
  *)
    echo "Unknown provider: $AI_PROVIDER, defaulting to anthropic"
    AUTH_CHOICE="apiKey"
    KEY_FLAG="--anthropic-api-key"
    ;;
esac

# Build onboard command as positional args — no eval, no shell injection risk
set -- openclaw onboard --non-interactive \
  --mode local \
  --auth-choice "$AUTH_CHOICE" \
  --secret-input-mode plaintext \
  --gateway-port "$GATEWAY_PORT" \
  --gateway-bind lan \
  --skip-skills

# Add provider-specific flags
if [ "$AI_PROVIDER" = "ollama" ]; then
  set -- "$@" --accept-risk
  [ -n "${AGENTBOT_MODEL_ID:-}" ] && set -- "$@" --custom-model-id "$AGENTBOT_MODEL_ID"
elif [ "$AI_PROVIDER" = "custom" ]; then
  [ -n "$API_KEY" ] && set -- "$@" --custom-api-key "$API_KEY"
  [ -n "${AGENTBOT_CUSTOM_URL:-}" ] && set -- "$@" --custom-base-url "$AGENTBOT_CUSTOM_URL"
  [ -n "${AGENTBOT_MODEL_ID:-}" ] && set -- "$@" --custom-model-id "$AGENTBOT_MODEL_ID"
  [ -n "${AGENTBOT_COMPAT:-}" ] && set -- "$@" --custom-compatibility "$AGENTBOT_COMPAT"
elif [ -n "$API_KEY" ] && [ -n "$KEY_FLAG" ]; then
  set -- "$@" "$KEY_FLAG" "$API_KEY"
fi

# Run onboard (skips if config already exists)
if [ ! -f "${HOME}/.openclaw/openclaw.json" ]; then
  echo "[$(date)] Running first-time onboarding..."
  "$@" || {
    echo "[$(date)] Onboard failed, falling back to manual config..."
    # Fallback: write minimal config
    # Persist gateway token across restarts — regenerating breaks live connections
GATEWAY_TOKEN_FILE="${HOME}/.openclaw/gateway-token"
if [ -n "${OPENCLAW_GATEWAY_TOKEN:-}" ]; then
  GATEWAY_TOKEN="$OPENCLAW_GATEWAY_TOKEN"
elif [ -f "$GATEWAY_TOKEN_FILE" ]; then
  GATEWAY_TOKEN="$(cat "$GATEWAY_TOKEN_FILE")"
else
  GATEWAY_TOKEN="$(openssl rand -hex 32)"
  mkdir -p "${HOME}/.openclaw"
  printf '%s' "$GATEWAY_TOKEN" > "$GATEWAY_TOKEN_FILE"
  chmod 600 "$GATEWAY_TOKEN_FILE"
fi
    mkdir -p "${HOME}/.openclaw"
    cat > "${HOME}/.openclaw/openclaw.json" << EOF
{
  "gateway": { "port": ${GATEWAY_PORT}, "bind": "lan", "trustedProxies": ["127.0.0.1", "10.0.0.0/8", "100.64.0.0/10", "172.16.0.0/12", "192.168.0.0/16"], "controlUi": { "allowedOrigins": ["*"], "dangerouslyDisableDeviceAuth": true, "dangerouslyAllowHostHeaderOriginFallback": true } },
  "auth": { "method": "token", "token": "${GATEWAY_TOKEN}" },
  "agents": { "defaults": { "model": { "primary": "openrouter/xiaomi/mimo-v2-pro" } } }
}
EOF
  }
else
  echo "[$(date)] Config exists, skipping onboarding."
fi

# Pre-seed workspace if empty
WORKSPACE="${HOME}/.openclaw/workspace"
if [ ! -f "${WORKSPACE}/AGENTS.md" ]; then
  echo "[$(date)] Seeding workspace..."
  mkdir -p "${WORKSPACE}"

  cat > "${WORKSPACE}/IDENTITY.md" << EOF
# IDENTITY.md
- Name: Agentbot-${USER_ID}
- Plan: ${PLAN}
- Platform: Agentbot (agentbot.raveculture.xyz)
EOF

  cat > "${WORKSPACE}/USER.md" << EOF
# USER.md
- User ID: ${USER_ID}
- Plan: ${PLAN}
- Provider: ${AI_PROVIDER}
EOF

  cat > "${WORKSPACE}/SOUL.md" << EOF
# SOUL.md
You are an AI assistant on the Agentbot platform.
Be helpful, concise, and proactive. You're part of the RaveCulture ecosystem.
EOF

  cat > "${WORKSPACE}/AGENTS.md" << EOF
# AGENTS.md

## Every Session
1. Read SOUL.md for your persona
2. Read USER.md for user context
3. Check TODO.md if it exists

## Safety
- Don't exfiltrate private data
- Don't run destructive commands without asking
- When in doubt, ask
EOF
fi

echo "[$(date)] Starting gateway..."

# Run gateway
exec node dist/index.js gateway --bind lan --port "${GATEWAY_PORT}"
