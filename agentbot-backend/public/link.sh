#!/bin/bash
# Agentbot Link — Connect your existing OpenClaw instance
# Usage: curl -fsSL agentbot.raveculture.xyz/link | bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="https://agentbot.raveculture.xyz"

log() { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $*"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔗 Agentbot Link                ║${NC}"
echo -e "${BLUE}║     Connect your OpenClaw instance   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Check OpenClaw is installed
if ! command -v openclaw &>/dev/null; then
    error "OpenClaw not found. Install it first: https://docs.openclaw.ai"
fi

OPENCLAW_VERSION=$(openclaw --version 2>/dev/null || echo "unknown")
log "Found OpenClaw: $OPENCLAW_VERSION"

# Find OpenClaw config
OPENCLAW_DIR="${HOME}/.openclaw"
CONFIG_FILE="${OPENCLAW_DIR}/openclaw.json"

if [ ! -f "$CONFIG_FILE" ]; then
    warn "OpenClaw config not found at $CONFIG_FILE"
    read -p "Enter config path: " CONFIG_FILE
    if [ ! -f "$CONFIG_FILE" ]; then
        error "Config file not found."
    fi
fi

log "Found config: $CONFIG_FILE"

# Get API key
echo ""
echo -e "${YELLOW}To link your instance, you need an Agentbot API key.${NC}"
echo ""
echo "Get one at: ${BLUE}${API_URL}/dashboard/api-keys${NC}"
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
    error "Invalid API key."
fi

USER_ID=$(echo "$VALIDATION" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
PLAN=$(echo "$VALIDATION" | grep -o '"plan":"[^"]*"' | cut -d'"' -f4)

log "User: ${USER_ID} | Plan: ${PLAN}"

# Read existing config
if ! command -v python3 &>/dev/null; then
    error "python3 is required for JSON manipulation."
fi

# Inject agentbot section into existing config
info "Updating OpenClaw config..."

python3 << PYEOF
import json

with open("${CONFIG_FILE}", "r") as f:
    config = json.load(f)

config["agentbot"] = {
    "apiUrl": "${API_URL}",
    "apiKey": "${API_KEY}",
    "userId": "${USER_ID}",
    "mode": "link"
}

with open("${CONFIG_FILE}", "w") as f:
    json.dump(config, f, indent=2)

print("Config updated.")
PYEOF

log "Config updated: $CONFIG_FILE"

# Register with Agentbot API
info "Registering with Agentbot platform..."
GATEWAY_TOKEN=$(python3 -c "import json; print(json.load(open('${CONFIG_FILE}')).get('auth',{}).get('token',''))" 2>/dev/null || echo "")

curl -sf -X POST "${API_URL}/api/register-link" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"${USER_ID}\",\"mode\":\"link\",\"gatewayToken\":\"${GATEWAY_TOKEN}\"}" >/dev/null 2>&1 || \
warn "Registration API call failed. Your instance is still linked locally."

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🔗 OpenClaw linked to Agentbot! ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo "  Dashboard:  ${BLUE}${API_URL}/dashboard${NC}"
echo "  Config:     ${CONFIG_FILE}"
echo ""
echo "  Your Agentbot features:"
echo "    • Dashboard for agent management"
echo "    • Skills marketplace"
echo "    • Usage analytics"
echo "    • Channel management"
echo ""
echo "  Restart OpenClaw to apply changes:"
echo "    openclaw gateway restart"
echo ""
