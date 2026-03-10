FROM ghcr.io/openclaw/openclaw:2026.3.2

WORKDIR /app

# Create persistent directories
RUN mkdir -p ~/.openclaw/workspace ~/.openclaw/config

# Expose WebSocket port and HTTP health check port
EXPOSE 18789 18790

# Use the image's default entrypoint/CMD
