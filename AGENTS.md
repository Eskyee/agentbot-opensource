# Agentbot Context

Last updated: Feb 2026

## Quick Summary
Agentbot is a hosted OpenClaw platform where users sign up, choose a plan, and deploy their AI agent. Users bring their own AI API keys (OpenRouter, Groq, Anthropic, etc.).

## Pricing (5 Plans)
| Plan | Price | RAM | CPU | 
|------|-------|-----|-----|
| Starter | £19/mo | 2GB | 1 |
| Pro | £39/mo | 4GB | 2 |
| Scale | £79/mo | 8GB | 4 |
| Enterprise | £149/mo | 16GB | 4 |
| White Glove | £199/mo | 32GB | 8 |

## Key Tech
- **Frontend:** Next.js 16 (Vercel)
- **Backend:** Node.js Express
- **Database:** Neon (PostgreSQL)
- **Payments:** Stripe (subscription)
- **Auth:** NextAuth (GitHub, Google, Email)
- **AI Models:** OpenRouter default (Kimi K2.5)

## Important Files
- `web/app/pricing/page.tsx` - Pricing page
- `web/app/docs/page.tsx` - Docs
- `agentbot-backend/src/index.ts` - Backend (Docker provisioning)
- `web/app/api/stripe/checkout/route.ts` - Stripe checkout

## Stripe Setup
- Products created manually in Stripe dashboard
- Prices: £19, £39, £79, £149, £199/month
- Checkout auto-creates prices if not found

## GitHub OAuth (for login)
- Client ID: Set in Vercel env vars (GITHUB_CLIENT_ID)

## Docker Resources
- Each plan gets tiered RAM/CPU limits
- Starter: 2GB RAM, 1 CPU
- Configured in `agentbot-backend/src/index.ts`

## No Credit System
Users bring their own API keys. No credits to manage.

## Known Issues
- GitHub OAuth callback needs correct Client ID in Vercel

## OpenClaw Versions

### 1. Personal OpenClaw (Mac mini local)
- NOT in Docker - runs directly on Mac mini
- Updated via: `openclaw update` CLI
- For: Your personal testing only
- Version: 2026.2.26 (latest)

### 2. Agentbot OpenClaw (Docker containers)
- Runs in Docker via agentbot-backend
- New deployments use: `ghcr.io/openclaw/openclaw:2026.2.26`
- Auto-updater checks GitHub releases daily
- For: Customer deployments only
