#!/bin/sh
# Agentbot OpenClaw Agent Container Entrypoint (Official Image)
# Uses ghcr.io/openclaw/openclaw:2026.3.22
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

# Build onboard command
ONBOARD_CMD="openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ${AUTH_CHOICE} \
  --secret-input-mode plaintext \
  --gateway-port ${GATEWAY_PORT} \
  --gateway-bind loopback \
  --skip-skills"

# Add provider-specific flags
if [ "$AI_PROVIDER" = "ollama" ]; then
  ONBOARD_CMD="${ONBOARD_CMD} --accept-risk"
  [ -n "${AGENTBOT_MODEL_ID:-}" ] && ONBOARD_CMD="${ONBOARD_CMD} --custom-model-id ${AGENTBOT_MODEL_ID}"
elif [ "$AI_PROVIDER" = "custom" ]; then
  [ -n "$API_KEY" ] && ONBOARD_CMD="${ONBOARD_CMD} --custom-api-key ${API_KEY}"
  [ -n "${AGENTBOT_CUSTOM_URL:-}" ] && ONBOARD_CMD="${ONBOARD_CMD} --custom-base-url ${AGENTBOT_CUSTOM_URL}"
  [ -n "${AGENTBOT_MODEL_ID:-}" ] && ONBOARD_CMD="${ONBOARD_CMD} --custom-model-id ${AGENTBOT_MODEL_ID}"
  [ -n "${AGENTBOT_COMPAT:-}" ] && ONBOARD_CMD="${ONBOARD_CMD} --custom-compatibility ${AGENTBOT_COMPAT}"
elif [ -n "$API_KEY" ] && [ -n "$KEY_FLAG" ]; then
  ONBOARD_CMD="${ONBOARD_CMD} ${KEY_FLAG} ${API_KEY}"
fi

# Run onboard (skips if config already exists)
if [ ! -f "${HOME}/.openclaw/openclaw.json" ]; then
  echo "[$(date)] Running first-time onboarding..."
  eval "$ONBOARD_CMD" || {
    echo "[$(date)] Onboard failed, falling back to manual config..."
    # Fallback: write minimal config
    GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(openssl rand -hex 16)}"
    mkdir -p "${HOME}/.openclaw"
    cat > "${HOME}/.openclaw/openclaw.json" << EOF
{
  "gateway": { "port": ${GATEWAY_PORT}, "bind": "loopback" },
  "auth": { "method": "token", "token": "${GATEWAY_TOKEN}" }
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
exec node dist/index.js gateway --bind loopback --port "${GATEWAY_PORT}"
