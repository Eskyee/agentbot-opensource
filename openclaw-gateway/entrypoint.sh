#!/bin/bash
set -e

echo "Starting OpenClaw Gateway..."

# Find and execute gog with full path
if command -v gog &> /dev/null; then
  gog serve --host 0.0.0.0 --port 18789 --log-level debug
else
  # Try common paths
  /usr/local/bin/gog serve --host 0.0.0.0 --port 18789 --log-level debug || \
  /usr/bin/gog serve --host 0.0.0.0 --port 18789 --log-level debug || \
  echo "gog binary not found"
fi
