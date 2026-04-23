FROM node:20.18.1-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

USER node
CMD ["node", "dist/index.js"]
