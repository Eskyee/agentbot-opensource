FROM node:20-alpine

WORKDIR /app

# Install docker-cli for docker commands (needed for agent provisioning)
RUN apk add --no-cache docker-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
