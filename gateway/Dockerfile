# Agentbot OpenClaw Gateway — production container for Railway
# Based on openclaw-railway patterns (persistent volume, health checks, auto-restart)
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./

RUN printf '[url "https://github.com/"]\n\tinsteadOf = ssh://git@github.com/\n\tinsteadOf = git@github.com:\n' > /root/.gitconfig
RUN npm install --omit=dev


FROM node:22-bookworm-slim

ARG OPENCLAW_VERSION=2026.4.2

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash procps curl git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN printf '[url "https://github.com/"]\n\tinsteadOf = ssh://git@github.com/\n\tinsteadOf = git@github.com:\n' > /root/.gitconfig \
    && npm install -g openclaw@${OPENCLAW_VERSION}

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

# /data = Railway volume mount for persistent state
RUN mkdir -p /data/.openclaw/workspace

ENV PATH="/app/node_modules/.bin:${PATH}"
ENV PORT=3000
ENV NODE_ENV=production
ENV OPENCLAW_DATA_DIR=/data

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -sf http://localhost:${PORT}/healthz || exit 1

CMD ["node", "src/server.js"]
