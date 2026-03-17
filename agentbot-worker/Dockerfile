FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Build
COPY . .
RUN npm run build

CMD ["node", "dist/worker.js"]
