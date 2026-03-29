# Gateway Dockerfile — wraps official OpenClaw image with custom entrypoint
# Fixes the loopback bind issue on Railway
FROM ghcr.io/openclaw/openclaw:2026.3.28

# Override entrypoint to bind to 0.0.0.0 (required for Railway public access)
ENTRYPOINT ["node", "dist/index.js", "gateway", "--bind", "0.0.0.0"]
