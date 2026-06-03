#!/bin/sh
set -e

# Inject the real gateway token from env into the config at runtime
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
  # Replace the placeholder with the real token
  sed -i "s/__OPENCLAW_REDACTED__/$OPENCLAW_GATEWAY_TOKEN/g" /root/.openclaw/openclaw.json
fi

exec openclaw gateway run --allow-unconfigured
