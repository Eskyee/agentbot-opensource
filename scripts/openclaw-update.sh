#!/bin/bash
# OpenClaw Auto-Update — checks, updates, commits, and pushes
set -euo pipefail

REPO_DIR="/Users/raveculture/agentbot"
LOG_FILE="/tmp/openclaw-update.log"

# Read current pinned version from Dockerfile.agent
CURRENT_PINNED=$(grep -o 'openclaw:[0-9]*\.[0-9]*\.[0-9]*' "$REPO_DIR/agentbot-backend/docker/Dockerfile.agent" | head -1 | cut -d: -f2)

# Get latest version from npm
LATEST=$(npm view openclaw version 2>/dev/null)

if [ -z "$LATEST" ]; then
  echo "FAIL: Could not fetch latest OpenClaw version" > "$LOG_FILE"
  exit 1
fi

if [ "$LATEST" = "$CURRENT_PINNED" ]; then
  echo "OK: Already on $CURRENT_PINNED" > "$LOG_FILE"
  exit 0
fi

echo "UPDATE: $CURRENT_PINNED → $LATEST" > "$LOG_FILE"

cd "$REPO_DIR"

# Update Docker agent image
sed -i '' "s|FROM ghcr.io/openclaw/openclaw:.*|FROM ghcr.io/openclaw/openclaw:$LATEST|" \
  agentbot-backend/docker/Dockerfile.agent

# Update gateway Dockerfile
sed -i '' "s|ARG OPENCLAW_VERSION=.*|ARG OPENCLAW_VERSION=$LATEST|" \
  gateway/Dockerfile

# Update learn page version display
sed -i '' "s|OpenClaw [0-9]\{4\}\.[0-9]*\.[0-9]*|OpenClaw $LATEST|" \
  web/app/learn/developers/page.tsx

# Commit and push
git add -A
git commit -m "Auto-update OpenClaw to $LATEST" --author="Atlas (Agentbot Ops) <djescaba@icloud.com>"
git push origin main

echo "DONE: Updated and pushed $CURRENT_PINNED → $LATEST" >> "$LOG_FILE"
