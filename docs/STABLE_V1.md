# Stable v1 Platform Snapshot

**Created:** April 7, 2025

## Architecture

- **Frontend:** Next.js on Vercel (agentbot.app)
- **Backend:** Node.js on Railway (agentbot-backend)
- **Database:** Neon (PostgreSQL)
- **Auth:** Clerk

## Active Services

- `agentbot-agent-{userId}-production.up.railway.app` (per-user gateways)
- Each user gets unique token (not shared platform token)
- OpenClaw Control UI accessible via dashboard

## Key Features

1. **Jobs Board** - Beta with 40+ skills
2. **OpenClaw Integration** - AI agent deployment
3. **Skills Marketplace** - 40+ skills available
4. **News/Updates** - Platform announcements
5. **x402 Gateway** - Paid API endpoints

## Fixed Issues

- Token mismatch (now fetches from DB per-user)
- Mobile responsive Jobs Board
- Repair route uses correct token

## Dependencies

- Railway (backend hosting)
- Vercel (frontend hosting)
- Neon (database)
- Cloudflare (DNS)
- Clerk (authentication)