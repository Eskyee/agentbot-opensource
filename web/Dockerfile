FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

COPY .next ./.next
COPY public ./public
COPY node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
