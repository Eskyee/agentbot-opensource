---
name: deploy-agentbot
description: Deploy Agentbot to production. Use when user wants to deploy their agent to production - on Render, Railway, Vercel, or self-hosted. Triggers on "deploy agentbot", "production deploy", "go live".
---

# Deploy Agentbot to Production

Guide user through deploying Agentbot to various platforms.

## Option 1: Vercel (Frontend + Backend API)

### Frontend (Next.js)
```bash
cd web
npm i -g vercel
vercel --prod
```

Configure in Vercel Dashboard:
- Environment variables from `.env.example`
- Framework: Next.js

### Backend (Render or Railway)
Recommended: Use Render for backend

1. Push code to GitHub
2. Connect GitHub repo to Render
3. Set environment variables:
   - `OPENROUTER_API_KEY`
   - `TELEGRAM_BOT_TOKEN` (if using)
   - `DISCORD_BOT_TOKEN` (if using)
   - `DATABASE_URL`
4. Build command: `npm install`
5. Start command: `npm start`

## Option 2: Docker (Self-Hosted)

### Using docker-compose

```bash
# Clone and configure
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d
```

### Manual Docker

```bash
# Backend
docker run -d \
  --name agentbot-backend \
  -p 3001:3001 \
  -e OPENROUTER_API_KEY=your_key \
  -e TELEGRAM_BOT_TOKEN=your_token \
  ghcr.io/raveculture/agentbot-backend:latest

# Frontend
docker run -d \
  --name agentbot-web \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  ghcr.io/raveculture/agentbot-web:latest
```

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional) |
| `DISCORD_BOT_TOKEN` | Discord bot token (optional) |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |

## Domain Setup

### Vercel
1. Add domain in Vercel Dashboard
2. Update DNS records as instructed
3. SSL auto-configures

### Self-Hosted
```bash
# Nginx config example
server {
    listen 443 ssl;
    server_name agentbot.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

## Verify Deployment

- [ ] Frontend loads at your domain
- [ ] Backend health check: `curl https://your-domain.com/api/health`
- [ ] Agent responds to messages
- [ ] Webhooks configured (Telegram/Discord/WhatsApp)

## Production Checklist

- [ ] HTTPS enabled
- [ ] Environment variables set in production
- [ ] Database backed up
- [ ] Logs configured (Sentry, Datadog, etc.)
- [ ] Domain points to correct server
- [ ] API rate limiting enabled
