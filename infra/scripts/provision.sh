#!/bin/bash
# Agentbot Provisioning Script
# Creates a new OpenClaw instance for a user

set -e

usage() {
    echo "Usage: $0 <user_id> <telegram_token> <ai_provider> <api_key> [port]"
    echo "  user_id: Unique identifier for the user"
    echo "  telegram_token: Telegram bot token from @BotFather"
    echo "  ai_provider: anthropic|openai|groq|gemini"
    echo "  api_key: API key for the AI provider"
    echo "  port: Optional port number (auto-assigned if not provided)"
    exit 1
}

[ -z "$4" ] && usage

USER_ID="$1"
TELEGRAM_TOKEN="$2"
AI_PROVIDER="$3"
API_KEY="$4"
PORT="${5:-}"

CONTAINER_NAME="openclaw-${USER_ID}"
VOLUME_NAME="openclaw-${USER_ID}"
CADDY_FILE="/etc/caddy/Caddyfile"
PORT_MAP="/opt/agentbot/port-map.txt"
DOMAIN="agentbot.com"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Auto-assign port if not provided
if [ -z "$PORT" ]; then
    # Find highest used port and add 1
    if [ -f "$PORT_MAP" ]; then
        PORT=$(awk -F: '{print $2}' "$PORT_MAP" | sort -n | tail -1)
        PORT=$((PORT + 1))
    else
        PORT=18001
    fi
fi

log "Provisioning $USER_ID on port $PORT..."

# Check if container already exists
if docker ps -a -q -f "name=$CONTAINER_NAME" | grep -q .; then
    log "ERROR: Container $CONTAINER_NAME already exists"
    exit 1
fi

# Create volume
log "Creating volume..."
docker volume create "$VOLUME_NAME"

# Create config directory structure
CONFIG_DIR="/tmp/openclaw-config-${USER_ID}"
mkdir -p "$CONFIG_DIR"

# Generate OpenClaw config
cat > "$CONFIG_DIR/openclaw.json" << EOF
{
  "providers": {
    "${AI_PROVIDER}": {
      "apiKey": "${API_KEY}"
    }
  },
  "channels": {
    "telegram": {
      "token": "${TELEGRAM_TOKEN}"
    }
  },
  "gateway": {
    "bind": "0.0.0.0",
    "port": 18789
  }
}
EOF

# Copy config to volume
docker run --rm \
    -v "${VOLUME_NAME}":/home/node/.openclaw \
    -v "${CONFIG_DIR}":/config:ro \
    alpine sh -c "mkdir -p /home/node/.openclaw/config && cp /config/openclaw.json /home/node/.openclaw/config/"

# Cleanup temp config
rm -rf "$CONFIG_DIR"

# Start container
log "Starting container..."
docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -v "${VOLUME_NAME}":/home/node/.openclaw \
    -p "${PORT}:18789" \
    --memory="512m" \
    --cpus="0.5" \
    ghcr.io/openclaw/openclaw:latest

# Wait for container to start
sleep 5

# Check if container is running
if ! docker ps -q -f "name=$CONTAINER_NAME" | grep -q .; then
    log "ERROR: Container failed to start"
    docker logs "$CONTAINER_NAME"
    exit 1
fi

# Record port mapping
echo "${USER_ID}:${PORT}" >> "$PORT_MAP"

# Add Caddy route
log "Adding Caddy route..."
if ! grep -q "${USER_ID}.${DOMAIN}" "$CADDY_FILE"; then
    cat >> "$CADDY_FILE" << EOF

${USER_ID}.${DOMAIN} {
    reverse_proxy localhost:${PORT}
}
EOF
    
    # Reload Caddy
    systemctl reload caddy
fi

log "SUCCESS: $USER_ID provisioned"
log "  Container: $CONTAINER_NAME"
log "  Port: $PORT"
log "  URL: https://${USER_ID}.${DOMAIN}"
