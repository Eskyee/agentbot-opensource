FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install for flexibility)
RUN npm install --production=false

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Start worker
CMD ["npm", "start"]
