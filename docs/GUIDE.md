# Agentbot - Complete Guide

## Overview

Agentbot is an AI agent deployment platform that lets users deploy OpenClaw agents in under 60 seconds. Users can chat with their agents via Telegram, Discord, or WhatsApp.

**Live URL:** https://agentbot.raveculture.xyz

---

## Features

### 1. Authentication
- **Email/Password** signup and login
- **Google OAuth** - Sign in with Google
- **GitHub OAuth** - Sign in with GitHub (needs setup)
- Sessions managed by NextAuth.js with JWT

### 2. Pricing Plans (6 tiers)

| Plan | Price | Features |
|------|-------|----------|
| **Free** | £0/3 days | Full access, Free AI, Telegram |
| **Starter** | £9/mo | Everything in Free + Your AI key, Priority support |
| **Pro** | £29/mo | 2x resources, Custom domain, WhatsApp |
| **Pro Plus** | £49/mo | 3x resources, Priority support |
| **Scale** | £79/mo | 5x resources, Dedicated support |
| **White Glove** | £199/mo | Everything in Scale + Team builds your agent, Onboarding call, 30-day support |

### 3. Core Pages

- **/** - Homepage with pricing, features, how it works
- **/dashboard** - User dashboard with sidebar, referral program, create agent
- **/agents** - Agent Builder with templates (Atlas, Social Media, Executive, Support, etc.)
- **/billing** - Credits & subscriptions management
- **/settings** - Account settings with tabs (Profile, Security, Notifications, API)
- **/marketplace** - Browse agent templates
- **/docs** - Documentation
- **/onboard** - New user onboarding with Stripe checkout

### 4. Stripe Integration

- Subscription payments via Stripe Checkout
- Price IDs stored in environment variables
- Webhook handling for subscription events
- 6 products configured in Stripe (all recurring monthly)

---

## Tech Stack

### Frontend
- **Next.js 16** (React framework)
- **TypeScript**
- **Tailwind CSS** (styling)
- **Prisma** (ORM for database)
- **NextAuth.js** (authentication)

### Backend
- **Node.js/Express** API
- **PostgreSQL** (Neon database)
- **Redis** (caching & queue)
- **Docker** (containerization)

### Infrastructure
- **Vercel** - Frontend hosting
- **Docker Hub** - Image storage
- **Neon** - PostgreSQL database

---

## Project Structure

```
agentbot/
├── web/                    # Next.js frontend
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── dashboard/          # Dashboard page
│   │   ├── agents/            # Agent Builder
│   │   ├── billing/           # Billing page
│   │   ├── settings/          # Settings page
│   │   ├── api/
│   │   │   ├── auth/         # NextAuth routes
│   │   │   ├── stripe/       # Stripe checkout/webhooks
│   │   │   └── ...
│   │   ├── components/        # React components
│   │   └── lib/              # Utilities
│   ├── prisma/               # Database schema
│   └── Dockerfile            # Frontend container
│
├── agentbot-backend/        # Express API
│   ├── src/
│   │   └── index.ts          # Main server
│   └── Dockerfile
│
├── agentbot-worker/         # Deployment worker
│   ├── src/
│   │   └── index.ts
│   └── Dockerfile
│
└── docker-compose.yml       # Local dev orchestration
```

---

## Environment Variables

### Frontend (.env.production)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID_TRIAL=price_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PRO_PLUS=price_...
STRIPE_PRICE_ID_SCALE=price_...
STRIPE_PRICE_ID_WHITE_GLOVE=price_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://agentbot.raveculture.xyz
NEXT_PUBLIC_APP_URL=https://agentbot.raveculture.xyz
NEXT_PUBLIC_API_URL=https://api.agentbot.raveculture.xyz
```

---

## Running Locally

### With Docker
```bash
cd agentbot
docker compose up -d
```

### With Vercel (Frontend)
```bash
cd web
vercel dev
```

---

## Deploying to Production

### 1. Build & Push Docker Images
```bash
docker build -t junglelab/agentbot-frontend:latest ./web
docker push junglelab/agentbot-frontend:latest
```

### 2. Deploy to Server
```bash
docker pull junglelab/agentbot-frontend:latest
docker compose up -d
```

### 3. Set Environment Variables on Server
Add all required env vars to your deployment platform

---

## OAuth Setup

### Google OAuth
1. Go to https://console.cloud.google.com/
2. Create OAuth credentials
3. Add authorized redirect URI:
   ```
   https://agentbot.raveculture.xyz/api/auth/callback/google
   ```

### GitHub OAuth
1. Go to https://github.com/settings/developers
2. Create OAuth App
3. Add callback URL:
   ```
   https://agentbot.raveculture.xyz/api/auth/callback/github
   ```

---

## Database Schema (Prisma)

Key tables:
- **User** - User accounts, OAuth info, password hash
- **Account** - OAuth provider accounts
- **Session** - Active sessions
- **VerificationToken** - Email verification tokens

---

## API Endpoints

### Authentication
- `GET /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/register` - Email registration

### Stripe
- `GET /api/stripe/checkout?plan=xxx` - Create checkout session
- `POST /api/stripe/webhook` - Handle Stripe events

### Agents
- `GET /api/agents` - List user agents
- `POST /api/agents` - Create agent
- `DELETE /api/agents/:id` - Delete agent

---

## Common Issues

### OAuth Not Working
1. Check redirect URIs match exactly
2. Verify Client ID and Secret are correct
3. Ensure env vars are loaded in production

### Stripe Checkout Fails
1. Verify price IDs exist in Stripe dashboard
2. Check price is "recurring" type for subscriptions
3. Ensure STRIPE_SECRET_KEY is live mode (sk_live_)

### Build Errors
1. Clear `.next` folder: `rm -rf .next`
2. Run build: `npm run build`
3. Check for TypeScript errors

---

## Next Steps to Learn

1. **Read the code** - Start with `web/app/page.tsx`
2. **Try the app** - Sign up, create an agent, test checkout
3. **Check Stripe Dashboard** - See test payments, customers
4. **Explore Vercel** - See deployments, analytics
5. **Check Docker logs** - `docker compose logs -f`

---

## Support

- Email: support@agentbot.raveculture.xyz
- Documentation: https://agentbot.raveculture.xyz/docs
