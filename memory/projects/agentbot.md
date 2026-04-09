# agentbot

## What
SaaS platform that provisions and manages AI agent containers for the music/culture industry (raveculture brand).
Each user gets a Docker container running the OpenClaw runtime, routed via Caddy to a unique subdomain.

## URLs
- Frontend: https://agentbot.raveculture.xyz
- Docs: https://raveculture.mintlify.app
- Alt frontend: https://web-iota-hazel-25.vercel.app

## Repos
- `agentbot-backend/` — Express/TypeScript API server
- `web/` — Next.js 14 frontend (NextAuth, Prisma, Stripe)

## Architecture
```
User → Next.js (web) → [INTERNAL_API_KEY] → agentbot-backend → Docker containers
                     ↓
                  Stripe / Discord / WhatsApp / Mux webhooks
```

## Database Tables
- `invite_codes` — invite-only registration, atomic consumption
- `api_keys` — SHA-256 hashed Bearer tokens, per-user plan
- `agent_registrations` — Home/Link mode installations
- `model_metrics` — per-user token usage tracking
- `container_metrics` — real-time container CPU/memory time-series
- `treasury_transactions` — USDC coordination log

## Key Files
- `src/index.ts` — main Express app, outer Bearer auth gate, container management
- `src/invite.ts` — invite code generation + validation
- `src/underground.ts` — culture vertical routes
- `src/routes/provision.ts` — agent provisioning
- `src/routes/metrics.ts` — DB-backed metrics API
- `src/routes/registration.ts` — Home/Link mode + API key validation
- `src/services/bus.ts` — agent-to-agent messaging (SSRF protected)
- `src/services/wallet.ts` — Coinbase CDP USDC wallets
- `src/services/ai-provider.ts` — OpenRouter + token quota
- `src/services/caddy.ts` — Caddy config management
- `src/lib/container-manager.ts` — Docker container lifecycle
- `src/middleware/auth.ts` — user context extraction (trusts outer gate)
- `src/middleware/plan.ts` — Stripe subscription plan gating

## Security Status
Full audit completed — all CRIT/HIGH/MED/LOW findings fixed.
Tests: 107/107 passing (security-audit.test.ts + webhook-security.test.ts)

## OpenClaw Runtime
- Image: `ghcr.io/openclaw/openclaw:2026.3.13`
- Port: 18789 (inside container)
- Volume: `openclaw-data-{userId}`
- Default model: `google/gemini-2.0-flash`
