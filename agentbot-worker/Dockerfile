FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./
RUN npm install && npm install -D ts-node-dev

COPY . .

CMD ["npm", "run", "dev"]
