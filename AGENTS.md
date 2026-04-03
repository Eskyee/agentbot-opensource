# AGENTS.md — Agentbot Review Guide

This file is the primary review context for AI coding agents, including Vercel Agent Code Review.
Use it to understand project-specific conventions, production constraints, and common failure modes.

## Project Structure

```
agentbot/
├── web/                     # Next.js frontend and API routes
│   ├── app/                 # App Router pages and route handlers
│   ├── components/          # React components
│   ├── lib/                 # Shared utilities and helpers
│   └── prisma/              # Prisma schema and client generation
├── agentbot-backend/        # Express/TypeScript backend API
├── docs/                    # Internal state and platform notes
└── mintlify-docs/           # Public documentation site
```

## Development Commands

### Web Application (Next.js)
```bash
cd web

# Start development server
npm run dev

# Build for production
npm run build

# Run tests (Playwright)
npm run test

# Lint code
npm run lint

# Generate Prisma client
npx prisma generate
```

### Backend API (Express)
```bash
cd agentbot-backend

# Start development server
npm run dev

# Run tests (Jest)
npm run test

# Build TypeScript
npm run build
```

## Runtime Baseline

- `web` uses Next.js 16 and builds with `next build --webpack`
- Production runtime for `web` is `node .next/standalone/server.js`
- `web` is deployed on Vercel
- Some public pages are intentionally `force-dynamic` because they render live platform counts from Prisma
- Do not reintroduce Turbopack-only assumptions without verifying Vercel build output

## Environment Setup

Copy `.env.example` to `.env` and configure:

**Web (.env):**
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Auth secret
- `NEXTAUTH_URL` — Auth URL
- `DISCORD_CLIENT_ID/SECRET` — Discord OAuth
- `TELEGRAM_BOT_TOKEN` — Telegram bot token
- `STRIPE_SECRET_KEY` — Payment processing

**Backend (.env):**
- `PORT` — Server port (default: 4000)
- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET` — JWT signing secret

## Database

Agentbot uses Prisma with PostgreSQL. Run migrations:
```bash
cd web && npx prisma migrate dev
```

## Testing

- **Unit tests:** Jest in backend
- **E2E tests:** Playwright in web
- Run all tests: `npm test` in each directory

## Code Style

- Prefer TypeScript-first route handlers and server components
- Keep edits aligned with existing patterns in `web/app/` and `web/components/`
- Use Zod for validation and Prisma for ORM-backed state
- Avoid mock data in production routes when real Prisma-backed data exists
- Prefer server-rendered real metrics over client-only placeholders for public dashboards

## Key Integrations

- **Auth:** NextAuth.js with multiple providers
- **Payments:** Stripe with subscription tiers
- **Messaging:** Telegram, Discord, WhatsApp bots
- **Blockchain:** Wagmi/Viem for Base network
- **AI:** OpenAI, Anthropic via AI SDK
- **Streaming:** Mux for live video

## Review Priorities

Focus review comments on:

1. Security regressions in auth, webhook verification, bearer-token gates, SSRF protections, or secret handling
2. Provisioning and agent lifecycle drift between Vercel `web`, Prisma state, and `agentbot-backend`
3. Public page data integrity — especially stats shown on `/marketplace`, `/demo`, `/dashboard/fleet`, and `/dashboard/colony`
4. Runtime regressions that break Vercel build/start behavior
5. Incorrect fallback behavior that hides production failures behind fake success states

## Known Production Constraints

- `web/app/api/provision/route.ts` is a legacy-heavy provisioning path and may succeed without creating a Prisma `Agent` row
- Public platform stats should distinguish between:
  - deployed agents: total Prisma `Agent` rows
  - live agents: agents with status `active` or `running`
- `User.openclawUrl` is not a substitute for an `Agent` record
- `/api/deployments` is partially compatibility-oriented and should not become the source of truth for platform metrics
- Build warnings should be treated seriously when they affect Vercel output, but warning-only noise is secondary to runtime correctness

## Testing Expectations

- For `web`, validate with `npm run build` before merging meaningful changes
- For route handler changes, prefer verifying the exact affected endpoint or page path
- For provisioning or dashboard work, confirm both:
  - the data contract returned by the route
  - the page that consumes it

## Avoid

- Replacing real counts with hardcoded marketing numbers
- Reporting auth-protected stats as if they are public platform totals
- Assuming `active` is the only valid “live” state without checking the current write paths
- Counting success based only on a passing local render when the Vercel build/runtime contract changed

## Common Tasks

### Adding a new bot platform
1. Create skill: `skills/add-[platform].md`
2. Add API route: `web/app/api/bot/[platform]/route.ts`
3. Add UI component: `web/components/bot/[Platform]Config.tsx`

### Adding a new API endpoint
1. Create route: `web/app/api/[feature]/route.ts`
2. Add Zod validation schema
3. Add to API docs

## Security

- Never commit secrets to git
- Use BotID for bot protection
- Enable 2FA on all accounts
- Run `npm audit` regularly
