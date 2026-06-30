# AGENTS.md — Agentbot

## Project Overview

Agentbot is an open-source AI agent platform. Monorepo managed by Turborepo with three workspaces:

| Workspace | Tech | Purpose |
|-----------|------|---------|
| `web/` | Next.js 16 (App Router) | Frontend + API routes (~140 handlers) |
| `agentbot-backend/` | Express + TypeScript | Agent lifecycle, webhooks, payments |
| `gateway/` | Gateway service | Routing |

## Commands

```bash
# Root (Turborepo)
npm run build          # Build all workspaces
npm run dev            # Dev servers in parallel
npm run lint           # Lint all
npm run test           # Test all

# Web
cd web && npm run dev                              # Dev server :3000
cd web && npm run build                            # Production build
cd web && npm run test                             # Playwright E2E
cd web && npm run lint                             # ESLint
cd web && npx prisma generate                      # Regenerate Prisma client

# Backend
cd agentbot-backend && npm run dev                 # Dev server :4000
cd agentbot-backend && npm run build               # TypeScript compile
cd agentbot-backend && npm test                    # Jest tests

# Type check (CI equivalent)
cd agentbot-backend && npx tsc --noEmit
```

**Build order:** `lint → typecheck → test → build`. Turborepo handles workspace dependencies automatically.

**Pre-commit hooks:** ESLint + Prettier + secret detection (via `.pre-commit-config.yaml`). Run `bash scripts/check-secrets.sh .` before pushing.

## Architecture

```
agentbot/
├── web/                          # Next.js 16 frontend
│   ├── app/                      # App Router pages + API routes
│   │   ├── api/                  # ~140 route handlers
│   │   ├── lib/hashline/         # Content-addressed file editing (anti-stale-line)
│   │   └── lib/init-deep.ts      # Hierarchical AGENTS.md generation
│   ├── components/               # React components
│   └── prisma/                   # Database schema + migrations
├── agentbot-backend/             # Express API
│   └── src/services/             # Business logic (underground, bus, wallet, etc.)
├── gateway/                      # Gateway service
├── skills/                       # AI skill definitions
└── scripts/                      # Dev + ops utilities
```

## Runtime Facts

- `web` builds with `next build --webpack` (NOT Turbopack)
- Production runtime: `node .next/standalone/server.js`
- Deployed on Vercel (frontend) + Railway (backend, x402-gateway, browser)
- Some public pages are `force-dynamic` — they render live Prisma counts
- Node.js ≥ 22 required

## Environment Setup

Copy `.env.example` to `.env` in both `web/` and `agentbot-backend/`.

**Web requires:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DISCORD_CLIENT_ID/SECRET`, `TELEGRAM_BOT_TOKEN`, `STRIPE_SECRET_KEY`

**Backend requires:** `PORT` (default 4000), `DATABASE_URL`, `JWT_SECRET`

## Code Conventions

- TypeScript strict — no `any` where avoidable
- `spawn()` not `exec()` — no shell injection
- Fail-closed security patterns (auth defaults to deny)
- Zod for validation, Prisma for ORM
- Server components preferred over client components
- Prefer real Prisma-backed data over mock/placeholder data in production routes

## Product Design

When shaping, editing, or reviewing user-facing UI, load
`.agents/skills/product-design/SKILL.md` as the single entry point. It routes to
the canonical visual source (`web/app/design-system.css`), shadcn/ui, and the
`web-design-guidelines` / `vercel-composition-patterns` skills.

**Applies to:** pages and components under `web/` (App Router pages,
`web/components/`, `web/app/components/`), product copy, interaction,
accessibility, responsive behavior, and reachable states (loading, empty,
error, permission, provisioning, billing, destructive). Also load it when
backend behavior changes a user-visible outcome (provisioning, wallet balance,
quota).

**Skip:** backend-only work in `agentbot-backend/`/`gateway/` with no
user-visible effect, telemetry, generated files (Prisma client, `out/`), docs,
marketing, the agent-runtime `skills/` directory, and tests with no shipped UI
impact.

Report which surfaces and references the skill loaded so findings can be traced
to their canonical source.

## Key Integrations

| Service | Purpose |
|---------|---------|
| NextAuth.js | Auth (Discord, etc.) |
| Stripe | Subscriptions |
| Prisma + PostgreSQL (Neon) | Database |
| OpenAI / Anthropic / OpenRouter | AI models |
| Wagmi/Viem | Base network (blockchain) |
| Telegram / Discord / WhatsApp | Bot messaging |
| Mux | Live video streaming |
| Coinbase CDP | Agent wallets (USDC) |

## External References

- [Mastercard Agent Toolkit](https://developer.mastercard.com/platform/documentation/agent-toolkit/) — Payment integration patterns for AI agents

## Known Gotchas

- `web/app/api/provision/route.ts` is legacy-heavy — may succeed without creating a Prisma `Agent` row
- Public stats must distinguish "deployed agents" (total rows) from "live agents" (status `active` or `running`)
- `User.openclawUrl` ≠ `Agent` record
- `/api/deployments` is compatibility-oriented, not source of truth for metrics
- Build warnings that affect Vercel output are serious; warning-only noise is secondary
- Do not reintroduce Turbopack-only assumptions without verifying Vercel build

## Review Priorities

1. Security: auth, webhook verification, SSRF, secret handling
2. Provisioning drift between `web`, Prisma, and `agentbot-backend`
3. Public page data integrity (`/marketplace`, `/demo`, `/dashboard/fleet`, `/dashboard/colony`)
4. Vercel build/start regressions
5. Fallback behavior hiding production failures

## CI/CD

GitHub Actions runs on push to `main` and PRs:
1. **Backend:** TypeScript check → build → Jest tests
2. **Frontend:** Prisma generate → build (with stub env) → Playwright E2E
3. **Pre-deploy validation** (main only)
4. **Deploy** → Vercel + Railway (auto-triggered)
5. **Smoke tests** against production endpoints

## Common Tasks

**Add a bot platform:** `skills/add-[platform].md` → `web/app/api/bot/[platform]/route.ts` → `web/components/bot/[Platform]Config.tsx`

**Add an API endpoint:** `web/app/api/[feature]/route.ts` + Zod schema + API docs

## Security

- Never commit secrets (CI runs GitLeaks + TruffleHog)
- Bearer token auth with `timingSafeEqual` (fail-closed)
- SHA-256 hashed API keys (raw keys never stored)
- SSRF blocklist: IPv4 private + IPv6 ULA + CGN
