# PRODUCTION DOCKERFILE - MULTI-STAGE BUILD
# Optimized for minimal size, security, and fast cold starts

# ========== BUILD STAGE ==========
FROM node:20-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache python3 make g++ dumb-init

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build

# ========== RUNTIME STAGE ==========
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache dumb-init curl

# Create non-root user (use gid/uid 1001 to avoid conflicts)
RUN addgroup -g 1001 appuser && \
    adduser -u 1001 -G appuser -s /sbin/nologin -D appuser

# Copy from builder
COPY --from=builder --chown=1001:1001 /build/dist ./dist
COPY --from=builder --chown=1001:1001 /build/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /build/package*.json ./

# Security: read-only filesystem where possible
RUN chmod -R 755 /app && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app/data

USER appuser

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
