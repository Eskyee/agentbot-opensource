# Agentbot OpenClaw Gateway — Railway wrapper
# Based on openclaw-railway template (persistent volume, health checks, auto-restart)
FROM node:22.14-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./

RUN printf '[url "https://github.com/"]\n\tinsteadOf = ssh://git@github.com/\n\tinsteadOf = git@github.com:\n' > /root/.gitconfig

RUN npm install --omit=dev


FROM node:22.14-bookworm-slim
COPY --from=docker.io/tailscale/tailscale:stable /usr/local/bin/tailscale /usr/local/bin/tailscale
COPY --from=docker.io/tailscale/tailscale:stable /usr/local/bin/tailscaled /usr/local/bin/tailscaled

ARG OPENCLAW_VERSION=2026.5.2

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    procps \
    curl \
    ffmpeg \
    git \
    ca-certificates \
    zip \
    && rm -rf /var/lib/apt/lists/*

RUN printf '[url "https://github.com/"]\n\tinsteadOf = ssh://git@github.com/\n\tinsteadOf = git@github.com:\n' > /root/.gitconfig \
    && npm install -g openclaw@${OPENCLAW_VERSION}

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY src/ ./src/
COPY public/ ./public/
COPY package.json ./
COPY scripts/agentbot-tailscale-start.sh /usr/local/bin/agentbot-tailscale-start

RUN chmod 755 /usr/local/bin/agentbot-tailscale-start \
    && mkdir -p /data/.openclaw/nodes /data/.openclaw/workspace /data/tailscale /var/run/tailscale \
    && chown -R node:node /var/run/tailscale

ENV PATH="/app/node_modules/.bin:${PATH}"
ENV PORT=3000
ENV NODE_ENV=production
ENV OPENCLAW_DATA_DIR=/data
ENV TAILSCALE_STATE_DIR=/data/tailscale

RUN chown -R node:node /app /data

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -sf http://localhost:${PORT}/api/status || exit 1

USER node
CMD ["sh", "-c", "agentbot-tailscale-start && exec node src/server.js"]
