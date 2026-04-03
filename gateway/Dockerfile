# OpenClaw Gateway for Railway — npm-based (no private GHCR needed)
FROM node:22-slim

# Install OpenClaw globally
RUN npm install -g openclaw@2026.4.2

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run as root for simplicity (Railway containers are ephemeral)
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
