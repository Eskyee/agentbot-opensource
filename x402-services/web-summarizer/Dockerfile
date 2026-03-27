FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY . .
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:3100/health || exit 1
CMD ["node", "index.js"]
