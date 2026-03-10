FROM ghcr.io/openclaw/openclaw:2026.3.2

WORKDIR /app

# Create persistent directories
RUN mkdir -p ~/.openclaw/workspace ~/.openclaw/config

# Expose WebSocket port (OpenClaw default)
EXPOSE 18789

# Use the image's default entrypoint/CMD
