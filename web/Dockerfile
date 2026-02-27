FROM node:20-alpine
WORKDIR /app

# Production mode - override with docker-compose for development
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps --force

COPY . .

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
