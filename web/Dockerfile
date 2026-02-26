FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=development
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=dev-secret
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps --force

COPY . .

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "run", "dev"]
