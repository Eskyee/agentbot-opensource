FROM node:20-alpine
WORKDIR /app

# Production mode
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

# Install dependencies first (skip scripts to avoid prisma generate failing)
RUN npm install --ignore-scripts --legacy-peer-deps --force

# Copy app and generate Prisma client
COPY . .
RUN npm install -g prisma@5.22.0 && prisma generate

# Build the Next.js app
RUN npm run build

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
