#!/bin/bash
# Agentbot Installer — One command to get started
# Usage: curl -fsSL agentbot.raveculture.xyz/install | bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="https://agentbot.raveculture.xyz"
IMAGE="ghcr.io/openclaw/openclaw:2026.3.13-1"

log() { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $*"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🦞 Agentbot Installer           ║${NC}"
echo -e "${BLUE}║     Run your own AI agent            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Check OS
OS="$(uname -s)"
case "$OS" in
    Linux*)   PLATFORM="linux" ;;
    Darwin*)  PLATFORM="macos" ;;
    *)        error "Unsupported OS: $OS. Only Linux and macOS are supported." ;;
esac
log "Detected platform: $PLATFORM"

# Check Docker
if ! command -v docker &>/dev/null; then
    warn "Docker not found. Installing..."
    if [ "$PLATFORM" = "macos" ]; then
        if command -v brew &>/dev/null; then
            brew install --cask docker
            log "Docker Desktop installed. Please open it and restart this script."
            open -a "Docker Desktop"
            exit 0
        else
            error "Please install Docker Desktop manually: https://docs.docker.com/desktop/install/mac-install/"
        fi
    elif [ "$PLATFORM" = "linux" ]; then
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker "$USER"
        log "Docker installed. Please log out and back in, then re-run this script."
        exit 0
    fi
fi

# Check Docker is running
if ! docker info &>/dev/null; then
    if [ "$PLATFORM" = "macos" ]; then
        info "Starting Docker Desktop..."
        open -a "Docker Desktop"
        sleep 10
    else
        sudo systemctl start docker
        sleep 3
    fi
    
    if ! docker info &>/dev/null; then
        error "Docker is not running. Please start Docker and try again."
    fi
fi
log "Docker is running"

# Get API key from user
echo ""
echo -e "${YELLOW}To connect your agent, you need an API key.${NC}"
echo ""
echo "Get one at: ${BLUE}${API_URL}/dashboard/api-keys${NC}"
echo "Or paste your Agentbot API key below:"
echo ""
read -p "API Key: " API_KEY

if [ -z "$API_KEY" ]; then
    error "API key is required."
fi

# Validate API key
info "Validating API key..."
VALIDATION=$(curl -sf -X POST "${API_URL}/api/validate-key" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" 2>/dev/null || echo '{"valid":false}')

if echo "$VALIDATION" | grep -q '"valid":false'; then
    error "Invalid API key. Get a valid key at ${API_URL}/dashboard/api-keys"
fi

log "API key valid"

# Extract user info
USER_ID=$(echo "$VALIDATION" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
PLAN=$(echo "$VALIDATION" | grep -o '"plan":"[^"]*"' | cut -d'"' -f4)

info "User: ${USER_ID} | Plan: ${PLAN}"

# Create data directory
DATA_DIR="$HOME/.agentbot"
mkdir -p "$DATA_DIR/workspace"
mkdir -p "$DATA_DIR/config"

# Generate gateway token
GATEWAY_TOKEN=$(openssl rand -hex 24)

# Write OpenClaw config
cat > "$DATA_DIR/config/openclaw.json" << EOF
{
  "auth": {
    "token": "${GATEWAY_TOKEN}",
    "method": "token"
  },
  "gateway": {
    "port": 18789,
    "bind": "127.0.0.1",
    "cors": { "origin": "*" },
    "controlUi": true
  },
  "agentbot": {
    "apiUrl": "${API_URL}",
    "apiKey": "${API_KEY}",
    "userId": "${USER_ID}",
    "mode": "home"
  },
  "models": {
    "default": "openrouter/anthropic/claude-sonnet-4",
    "fallbacks": ["openrouter/google/gemini-2.5-flash"]
  },
  "session": {
    "max": 10,
    "timeoutMinutes": 60,
    "persist": true
  },
  "timezone": "Europe/London"
}
EOF

log "Config written to $DATA_DIR/config/openclaw.json"

# Pull the official OpenClaw image
info "Pulling official OpenClaw image..."
docker pull "ghcr.io/openclaw/openclaw:2026.3.13-1" || \
warn "Could not pull image. Check your internet connection."

# Create Docker network
docker network create agentbot-net 2>/dev/null || true

# Stop existing container if running
docker rm -f agentbot-local 2>/dev/null || true

# Start the container
info "Starting your agent..."
docker run -d \
    --name agentbot-local \
    --network agentbot-net \
    --memory "4g" \
    --cpus "2" \
    -p "127.0.0.1:18789:18789" \
    -v "$DATA_DIR/workspace:/home/node/.openclaw/workspace" \
    -v "$DATA_DIR/config:/home/node/.openclaw" \
    -e "HOME=/home/node" \
    -e "TERM=xterm-256color" \
    -e "NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache" \
    -e "OPENCLAW_NO_RESPAWN=1" \
    -e "AGENTBOT_USER_ID=${USER_ID}" \
    -e "AGENTBOT_API_KEY=${API_KEY}" \
    -e "AGENTBOT_MODE=home" \
    --init \
    --restart unless-stopped \
    "$IMAGE"

log "Container started"

# Wait for health
info "Waiting for agent to start..."
sleep 5

HEALTH=$(curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/health 2>/dev/null || echo "000")

if [ "$HEALTH" = "200" ]; then
    log "Agent is healthy!"
else
    warn "Agent may still be starting. Check: docker logs agentbot-local"
fi

# Register with Agentbot API
info "Registering with Agentbot platform..."
curl -sf -X POST "${API_URL}/api/register-home" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"${USER_ID}\",\"mode\":\"home\",\"gatewayToken\":\"${GATEWAY_TOKEN}\"}" >/dev/null 2>&1 || \
warn "Registration API call failed. Your agent is still running locally."

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🦞 Agentbot is running!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo "  Dashboard:  ${BLUE}${API_URL}/dashboard${NC}"
echo "  Gateway:    ${BLUE}http://127.0.0.1:18789${NC}"
echo "  Config:     ${DATA_DIR}/config/openclaw.json"
echo "  Workspace:  ${DATA_DIR}/workspace"
echo ""
echo "  Useful commands:"
echo "    docker logs agentbot-local        # View logs"
echo "    docker restart agentbot-local     # Restart"
echo "    docker stop agentbot-local        # Stop"
echo ""
echo "  Connect channels at: ${BLUE}${API_URL}/dashboard/channels${NC}"
echo ""
