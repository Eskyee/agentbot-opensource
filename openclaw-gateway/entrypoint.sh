#!/bin/bash
set -e

echo "Starting OpenClaw Gateway..."

# Start OpenClaw with WebSocket on port 18789
exec gog serve \
  --host 0.0.0.0 \
  --port 18789 \
  --log-level debug
