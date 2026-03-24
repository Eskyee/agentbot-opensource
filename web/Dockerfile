FROM node:22-alpine
WORKDIR /app

# Production mode - override with docker-compose for development
# Note: NODE_ENV=production set AFTER build to ensure devDeps are installed

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps --force

# Now copy the full app and generate Prisma client
COPY . .
RUN npx prisma@5.22.0 generate

# Build Next.js for production
RUN npx next build

# Set production mode after build
ENV NODE_ENV=production

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
