FROM ghcr.io/openclaw/openclaw:2026.3.2

WORKDIR /app

# Create persistent directories
RUN mkdir -p ~/.openclaw/workspace ~/.openclaw/config

# Copy startup script (will be executed as-is)
COPY entrypoint.sh /entrypoint.sh

# Expose WebSocket port
EXPOSE 18789

# Run entrypoint directly with sh
CMD ["/bin/sh", "/entrypoint.sh"]
