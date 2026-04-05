# Agentbot OpenClaw Gateway — Railway wrapper
# Based on openclaw-railway template (persistent volume, health checks, auto-restart)
FROM node:22-bookworm-slim AS builder

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


FROM node:22-bookworm-slim

ARG OPENCLAW_VERSION=latest

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    procps \
    curl \
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

RUN mkdir -p /data/.openclaw/nodes /data/.openclaw/workspace

ENV PATH="/app/node_modules/.bin:${PATH}"
ENV PORT=3000
ENV NODE_ENV=production
ENV OPENCLAW_DATA_DIR=/data

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -sf http://localhost:${PORT}/api/status || exit 1

CMD ["node", "src/server.js"]

