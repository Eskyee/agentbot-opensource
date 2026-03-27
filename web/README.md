<div align="center">

# Agentbot

**Deploy autonomous AI agents in 60 seconds.**

[![CI](https://github.com/Eskyee/agentbot-opensource/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Eskyee/agentbot-opensource/actions/workflows/ci-cd.yml)
[![Secret Scan](https://github.com/Eskyee/agentbot-opensource/actions/workflows/check-secrets.yml/badge.svg)](https://github.com/Eskyee/agentbot-opensource/actions/workflows/check-secrets.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Eskyee/agentbot-opensource)

[Website](https://agentbot.raveculture.xyz) · [Docs](https://raveculture.mintlify.app) · [Discord](https://discord.gg/eskyee) · [Report a Bug](https://github.com/Eskyee/agentbot-opensource/issues) · [Request a Feature](https://github.com/Eskyee/agentbot-opensource/issues)

</div>

---

## What is Agentbot?

Agentbot is an open-source platform for deploying isolated AI agents connected to Telegram, Discord, and WhatsApp. Each agent runs in its own Docker container (powered by [OpenClaw](https://github.com/raveculture/openclaw)), with its own AI model, skills, and wallet.

**You own the infrastructure. We provide the platform.**

---

## Features

- 🚀 **One-click deploy** — From signup to live agent in under 60 seconds
- 🔌 **Multi-channel** — Telegram, Discord, WhatsApp, REST webhooks
- 🧠 **BYOK** — Bring Your Own Key: OpenRouter, Anthropic, OpenAI, Gemini, Groq
- 🐳 **Container isolation** — One Docker container per agent, fully isolated
- 💰 **x402 payments** — Agents can send and receive USDC on Base
- 🛡️ **Security-first** — Bearer auth, hashed API keys, SSRF blocklist, fail-closed webhooks
- 📊 **Observability** — Real-time dashboard, cost tracking, heartbeat monitoring

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource
cp web/.env.example web/.env   # fill in your values
docker compose up -d
```

Open http://localhost:3000

### Manual

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource

# Frontend
cd web
cp .env.example .env          # fill in your values
npm install
npm run dev                   # http://localhost:3000

# Backend (new terminal)
cd ../agentbot-backend
cp .env.example .env
npm install
npm run dev                   # http://localhost:4000
```

### Makefile shortcuts

```bash
make up        # Start all services
make down      # Stop all services
make logs      # Tail logs
make health    # Check service status
```

---

## Environment Variables

Copy `web/.env.example` to `web/.env` and fill in the values. Required fields:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon / PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32-char secret for NextAuth |
| `NEXTAUTH_URL` | ✅ | Your app URL (e.g. `http://localhost:3000`) |
| `INTERNAL_API_KEY` | ✅ | Shared secret between frontend and backend |
| `OPENROUTER_API_KEY` | BYOK | Default AI provider |
| `ANTHROPIC_API_KEY` | BYOK | Claude models |
| `OPENAI_API_KEY` | BYOK | GPT models |
| `STRIPE_SECRET_KEY` | Payments | Stripe subscription billing |
| `RESEND_API_KEY` | Email | Transactional email |
| `CDP_API_KEY_NAME` | Wallets | Coinbase CDP agent wallets |
| `SOUL_SERVICE_URL` | Optional | Your deployed backend URL |
| `X402_PAY_TO` | Optional | USDC address for x402 payments |

> **BYOK** — Agentbot never takes a cut of your AI API costs. Bring your own keys and pay providers directly.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER                                      │
│               Telegram / Discord / WhatsApp                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTBOT PLATFORM                            │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web UI    │  │  Dashboard   │  │   Onboarding Flow    │  │
│  │  (Next.js)  │  │  (Next.js)   │  │     (Next.js)        │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         └────────────────┼───────────────────────┘             │
│                          │                                      │
│                  ┌───────▼───────┐                             │
│                  │   REST API    │                             │
│                  │ (Express.js)  │                             │
│                  └───────┬───────┘                             │
└──────────────────────────┼─────────────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
┌────────────────┐ ┌───────────────┐ ┌────────────────┐
│  PostgreSQL    │ │   OpenClaw    │ │  Skills &      │
│  (Neon)        │ │  Container    │ │  Tools         │
│                │ │  (Docker)     │ │  Registry      │
└────────────────┘ └───────────────┘ └────────────────┘
```

### Provisioning Flow

```
User clicks "Deploy"
  → Validate bot token
  → Create Docker container
  → Pull OpenClaw image
  → Configure AI model + channels
  → Agent live ✅
```

### Agent Container (per-user isolation)

```
Docker Container
├── OpenClaw runtime
│   ├── Message handler
│   ├── Agent core (AI model)
│   └── Skills (web-search, file-handler, code-runner, ...)
├── Mounted volume: /home/node/.openclaw
│   ├── agents/    (configs)
│   ├── workspace/ (files)
│   └── logs/
└── Environment: AI API key, channel tokens
```

---

## Plans

| Plan | Price | Agents | Memory | vCPUs |
|------|-------|--------|--------|-------|
| **Solo** | £29/mo | 1 | 2 GB | 1 |
| **Collective** | £69/mo | 3 | 4 GB | 2 |
| **Label** | £149/mo | 10 | 8 GB | 4 |
| **Network** | £499/mo | Unlimited | 16 GB | 4 |

Or **self-host for free** — same codebase, your own infrastructure.

---

## Project Structure

```
agentbot-opensource/
├── web/                        # Next.js 16 frontend + API routes
│   ├── app/
│   │   ├── api/               # ~140 API route handlers
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── onboard/           # Agent setup wizard
│   │   └── components/        # React components
│   ├── lib/                   # Shared utilities
│   └── prisma/                # Database schema + migrations
├── agentbot-backend/           # Express.js API server
│   └── src/
│       ├── routes/            # REST endpoints
│       └── services/          # Business logic (caddy, wallet, bus, ...)
├── mintlify-docs/              # Documentation site
├── scripts/                   # Dev + ops utilities
│   ├── check-secrets.sh       # Pre-push secret scanner
│   └── sync-to-opensource.sh  # Private → public sync
└── .github/workflows/         # CI/CD + secret scanning
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

**Quick guide:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes — keep them focused and minimal
4. Run the secret scanner before pushing: `bash scripts/check-secrets.sh`
5. Open a pull request against `main`

**Before your first PR:**
- Check open [issues](https://github.com/Eskyee/agentbot-opensource/issues) for something to work on
- For new features, open an issue first to discuss the approach
- Keep PRs focused — one feature or fix per PR

---

## Security

Found a vulnerability? Please **do not** open a public issue.

See [SECURITY.md](SECURITY.md) for the responsible disclosure policy.

**Quick checks we run on every push:**
- GitLeaks + TruffleHog secret scanning
- Custom pattern scanner (`scripts/check-secrets.sh`) for emails, wallet addresses, and private URLs
- `npm audit` — 0 known vulnerabilities in both `web/` and `agentbot-backend/`

---

## Self-Hosting

Full self-hosting guide: [DEPLOYMENT.md](DEPLOYMENT.md)

**Minimum requirements:**
- Node.js 20+
- Docker 24+
- PostgreSQL 15+ (or [Neon](https://neon.tech) free tier)
- 1 GB RAM per concurrent agent container

**Recommended stack:**
- Frontend: [Vercel](https://vercel.com) (auto-deploys from `main`)
- Backend: [Render](https://render.com) or any Docker host
- Database: [Neon](https://neon.tech) serverless Postgres
- Email: [Resend](https://resend.com)

---

## License

MIT — see [LICENSE](LICENSE).

Built with ❤️ by [raveculture](https://agentbot.raveculture.xyz).
