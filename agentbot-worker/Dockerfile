# PRODUCTION DOCKERFILE FOR WORKER - MULTI-STAGE BUILD

FROM node:20-alpine AS builder

WORKDIR /build

RUN apk add --no-cache python3 make g++ dumb-init

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# ========== RUNTIME ==========
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

RUN addgroup -g 1001 appuser && \
    adduser -u 1001 -G appuser -s /sbin/nologin -D appuser

COPY --from=builder --chown=1001:1001 /build/dist ./dist
COPY --from=builder --chown=1001:1001 /build/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /build/package*.json ./

RUN mkdir -p /app/data && chown -R appuser:appuser /app/data

USER appuser

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
