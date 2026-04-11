#!/bin/bash
# OpenClaw Auto-Update — checks for new versions and updates Dockerfiles
# Run via cron or OpenClaw heartbeat
set -euo pipefail

REPO_DIR="/Users/raveculture/agentbot"
CURRENT_PINNED="2026.4.10"

# Get latest version from npm
LATEST=$(npm view openclaw version 2>/dev/null)

if [ -z "$LATEST" ]; then
  echo "Could not fetch latest OpenClaw version"
  exit 1
fi

echo "Current: $CURRENT_PINNED"
echo "Latest:  $LATEST"

if [ "$LATEST" = "$CURRENT_PINNED" ]; then
  echo "Already up to date."
  exit 0
fi

echo "New version available! Updating..."

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

# Update the pinned version in this script
sed -i '' "s|CURRENT_PINNED=\".*\"|CURRENT_PINNED=\"$LATEST\"|" \
  "$0"

# Commit
git add -A
git commit -m "Auto-update OpenClaw to $LATEST

- Docker agent image → $LATEST
- Gateway Dockerfile → $LATEST
- Learn page → $LATEST"

echo "Updated to $LATEST. Committed. Push when ready."
