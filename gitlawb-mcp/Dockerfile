FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production 2>/dev/null || npm install --production --legacy-peer-deps

# Copy source
COPY dist/ ./dist/
COPY README.md ./

# MCP server runs on stdio
CMD ["node", "dist/index.js"]
