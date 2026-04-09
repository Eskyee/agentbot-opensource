# Unified Dockerfile for agentbot-backend
# RUN_MODE=api (default) — runs the API server
# RUN_MODE=worker — runs the inline scheduler worker
# RUN_MODE=cron — runs just the cron/scheduler

FROM node:22-alpine

WORKDIR /app

# Install system deps — docker-cli for container provisioning, curl for health checks
RUN apk add --no-cache dumb-init curl docker-cli bash

COPY package*.json ./
# Install ALL deps first (tsc is a devDependency needed for build)
RUN npm ci --ignore-scripts || npm install --ignore-scripts

COPY . .
RUN npm run build
# Remove devDependencies after build
RUN npm prune --production

# Copy provision script
RUN mkdir -p /app/docker
COPY docker/provision.sh /app/docker/provision.sh
RUN chmod +x /app/docker/provision.sh

# Remove source files after build
RUN rm -rf src

USER node

ENTRYPOINT ["dumb-init", "--"]

# Default: run the API server (scheduler starts inline)
CMD ["node", "dist/index.js"]
