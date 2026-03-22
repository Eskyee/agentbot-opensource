# Tech Stack & Tools

## Backend
- **Runtime**: Node.js 20+ / TypeScript
- **Framework**: Express.js
- **DB**: PostgreSQL via `pg` / `@neondatabase/serverless`
- **Container**: Docker (spawn-based, no exec)
- **Proxy**: Caddy (programmatic config)
- **Auth**: Bearer token (timingSafeEqual), NextAuth on frontend
- **Payments**: Stripe (subscriptions, webhooks)
- **AI**: OpenRouter (multi-model routing)
- **Wallets**: Coinbase CDP (USDC, per-agent wallets)
- **Process**: dumb-init as PID 1, USER node (non-root)

## Frontend (web/)
- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth + Prisma adapter
- **DB**: Prisma + PostgreSQL
- **Payments**: Stripe
- **Video**: Mux
- **Chat**: WhatsApp Cloud API, Discord
- **Deploy**: Vercel

## Testing
- **Backend**: Jest + ts-jest + supertest
- **Frontend**: Playwright
- **Security tests**: `security-audit.test.ts`, `webhook-security.test.ts`

## Webhook Handlers (web/app/api/webhooks/)
- `discord/` — API key auth (timingSafeEqual)
- `discord/interactions/` — Ed25519 signature (SubtleCrypto)
- `whatsapp/` — HMAC-SHA256, fail-closed
- `mux/` — HMAC-SHA256 + 5-min replay check
- `stripe/` — constructEvent(), fail-closed

## Environment Variables (key ones)
- `INTERNAL_API_KEY` — shared secret between web and backend
- `WALLET_ENCRYPTION_KEY` — AES key for agent wallet private keys
- `DATABASE_URL` — PostgreSQL connection string
- `OPENCLAW_IMAGE` — Docker image to provision
- `AGENTS_DOMAIN` — base domain for agent subdomains
- `AGENTBOT_DATA_DIR` — data directory (default: /opt/agentbot/data)
