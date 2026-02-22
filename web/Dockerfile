FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=https://agentbot.raveculture.xyz
ENV NEXTAUTH_URL=https://agentbot.raveculture.xyz
ENV NEXTAUTH_SECRET=production-secret-change-me
ENV NEXT_PUBLIC_API_URL=https://api.agentbot.raveculture.xyz

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
