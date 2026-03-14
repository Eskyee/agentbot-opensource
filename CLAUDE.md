# Agentbot — Claude Agent Instructions

## Repository overview
- `web/` — Next.js 16 app (App Router, Tailwind, Prisma, NextAuth)
- `web/prisma/schema.prisma` — database schema
- `.github/workflows/` — CI/CD pipelines

## Security (Grade A+)

- **Use `proxy.ts`** instead of `middleware.ts` (Next.js 16 requirement)
- All secrets via environment variables — never hardcode
- Admin endpoints use `ADMIN_EMAILS` env var (comma-separated emails)
- Debug routes (`/api/debug-*`, `/api/test-*`) blocked in production via proxy

## Development workflow

### Branches
- All agent work goes on `claude/<task-name>-<session-id>` branches (already configured)
- **Never push directly to `main`** — PRs only
- A GitHub Action (`.github/workflows/auto-pr.yml`) **automatically creates a PR** when you push to a `claude/` branch — you do NOT need to create PRs manually

### Commits
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`
- One focused commit per logical change; don't batch unrelated fixes

### After making changes
1. Commit with a descriptive message
2. `git push -u origin <branch>` — the auto-PR workflow will open the PR
3. Inform the user the PR is ready to review and merge on GitHub

## Tech stack
- **Auth**: Base Account SDK (`@base-org/account`) + SIWE + NextAuth `CredentialsProvider(id: "wallet")`
- **Database**: PostgreSQL + Prisma (use shared `import { prisma } from "@/app/lib/prisma"` singleton)
- **Payments**: Stripe (lazy singleton in `web/app/lib/stripe.ts`)
- **Email**: Resend (instantiate inside function body, never at module level)
- **Basenames**: `GET /api/basename?address=0x...` + `useBasename` hook

## Critical rules
- `@base-org/account-ui` must be loaded via `dynamic({ ssr: false })` — it has Preact internals that crash during SSR
- Never use `new PrismaClient()` directly — always import the shared singleton
- Never instantiate `Resend` or `Stripe` at module level — causes build crashes on Vercel
- SIWE CredentialsProvider must have `id: "wallet"` to avoid NextAuth provider collision
- Mobile overlays must NOT be children of elements with `backdrop-filter` — breaks touch events on iOS

## Stripe product catalog (live — do not change IDs)

Active plans (GBP, monthly recurring):
| Plan       | Product ID              | Price  |
|------------|-------------------------|--------|
| Underground| prod_U9B91PN8c9puXP     | £29/mo |
| Collective | prod_U98tpiNSfUlIlP     | £69/mo |
| Label      | prod_U9CBhMyxK2fr2z     | £199/mo|

Old archived products: `prod_U3Gdww8XSjeqdg`, `prod_U3GE6JFRWQPhB2`, `prod_U3G8YgmflMAlGr`, `prod_U3FjKT5K7J3i9O`, `prod_U3Fh9KSx8UzKs1`, `prod_U0Spg1EIGmFDYt` — all archived, do not re-activate.

Checkout flow: `GET /api/stripe/checkout?plan=<underground|collective|label>` → 303 redirect to Stripe hosted checkout → subscription mode, monthly recurring, GBP.

## Environment variables needed
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional)
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `OPENROUTER_API_KEY`
- `ADMIN_EMAILS` - Comma-separated admin emails for admin endpoints
