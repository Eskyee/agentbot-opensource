FROM node:20-alpine
WORKDIR /app

# Production mode - override with docker-compose for development
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

# Install dependencies first (skip scripts to avoid prisma generate failing)
RUN npm install --ignore-scripts --legacy-peer-deps --force

# Now copy the full app and generate Prisma client
COPY . .
RUN npx prisma@5.22.0 generate

# Build Next.js for production
RUN npx next build

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
