FROM node:22.13.0-alpine AS development
WORKDIR /app

RUN apk add --no-cache openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma

RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma@5.22.0 generate

ENTRYPOINT []
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "run", "dev"]

FROM node:22.13.0-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --legacy-peer-deps

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
