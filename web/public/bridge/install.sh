#!/bin/bash
# Agentbot OpenClaw Bridge — one-liner installer
# Usage: BRIDGE_SECRET=xxx bash <(curl -sSL https://agentbot.sh/bridge/install.sh)

set -e

SECRET="${BRIDGE_SECRET:?Set BRIDGE_SECRET first}"
OPENCLAW_CMD="${OPENCLAW_CMD:-openclaw}"
BRIDGE_DIR="$HOME/.openclaw/bridge"
BRIDGE_URL="${BRIDGE_URL:-https://agentbot.sh}"
POLL_INTERVAL="${POLL_INTERVAL:-3000}"

echo "🦞 Agentbot Bridge Installer"
echo ""

# Create bridge directory
mkdir -p "$BRIDGE_DIR"

# Download bridge client
echo "↓ Downloading bridge client..."
curl -sSL "$BRIDGE_URL/bridge/client.js" -o "$BRIDGE_DIR/client.js"

# Write config
cat > "$BRIDGE_DIR/config.env" << EOF
BRIDGE_SECRET=$SECRET
BRIDGE_URL=$BRIDGE_URL
OPENCLAW_CMD=$OPENCLAW_CMD
POLL_INTERVAL=$POLL_INTERVAL
EOF

echo "✓ Bridge client installed to $BRIDGE_DIR/client.js"
echo ""
echo "🚀 Starting bridge..."
echo ""

# Run the bridge
source "$BRIDGE_DIR/config.env"
exec node "$BRIDGE_DIR/client.js"
