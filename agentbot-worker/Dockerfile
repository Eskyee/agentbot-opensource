FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init curl

# Create non-root user (use different UID/GID)
RUN addgroup -g 1001 appgroup 2>/dev/null || true && \
    adduser -u 1001 -G appgroup -s /sbin/nologin 2>/dev/null || true

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Set ownership
RUN chown -R appuser:appgroup /app || true

USER appuser

# Start worker
CMD ["npm", "start"]
