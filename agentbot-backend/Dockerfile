FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./
# Use --omit=dev in production to exclude devDependencies from the final image
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# Remove source files after build to reduce attack surface
RUN rm -rf src

# Run as non-root user for security
USER node

# Use dumb-init as PID 1 to properly handle signals and reap zombies
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
