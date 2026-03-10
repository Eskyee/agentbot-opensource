FROM ghcr.io/openclaw/openclaw:2026.3.2

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Create persistent directories
RUN mkdir -p ~/.openclaw/workspace ~/.openclaw/config

# Copy startup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose WebSocket port
EXPOSE 18789

ENTRYPOINT ["/entrypoint.sh"]
