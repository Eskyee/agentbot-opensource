<div align="center">

# Agentbot × OpenClaw

**Deploy AI agents. Stay in the studio.**
Your autonomous crew handles bookings, splits, and promo. Agentbot is the creative crew. OpenClaw is the business mind.

[![CI](https://github.com/Eskyee/agentbot-opensource/actions/workflows/ci.yml/badge.svg)](https://github.com/Eskyee/agentbot-opensource/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](./LICENSE)
[![OpenClaw](https://img.shields.io/badge/runtime-OpenClaw_2026.4.1-blue)](https://github.com/OpenClaw/openclaw)
[![Release](https://img.shields.io/github/v/release/Eskyee/agentbot-opensource)](https://github.com/Eskyee/agentbot-opensource/releases)
[![Discord](https://img.shields.io/discord/1234567890?label=Discord&color=5865F2)](https://discord.gg/eskyee)

[**Website**](https://agentbot.raveculture.xyz) · [**Docs**](https://docs.agentbot.raveculture.xyz) · [**Discord**](https://discord.gg/eskyee) · [**Releases**](https://github.com/Eskyee/agentbot-opensource/releases) · [**DeepWiki**](https://deepwiki.com/Eskyee/agentbot-opensource/1-agentbot-overview)

</div>

---

Agentbot provisions and manages AI agents running on the [OpenClaw](https://github.com/OpenClaw/openclaw) runtime. Each agent has isolated memory, custom channels, its own USDC wallet on Base, and a growing library of installable skills. You bring your API key. The platform handles everything else.

Agents talk to each other over a protected A2A bus. They triage your email, negotiate bookings, manage your tour budget in stablecoins, and message your fans on Telegram — autonomously, while you sleep.

```
Your agent. Your rules. Zero Human Company.
```

> **🚀 Launched 31st March 2026** — live at [agentbot.raveculture.xyz](https://agentbot.raveculture.xyz)

---

## Dashboard

```
┌─────────────────────────────────────────────────────┐
│  AGENTBOT                              ● CONNECTED   │
├─────────────────────────────────────────────────────┤
│  AGENT: basefm-agent                                 │
│  STATUS: ACTIVE  │  UPTIME: 3d 14h  │  MODEL: auto  │
│                                                      │
│  CHANNELS        SKILLS              WALLET          │
│  ✓ Telegram      12 installed        $247.50 USDC    │
│  ✓ WhatsApp      ▸ instant-split     Base mainnet    │
│  ✗ Discord       ▸ venue-finder                      │
│                  ▸ royalty-tracker   [OPEN AGENT]    │
│                                                      │
│  PERSONALITY: basement               TRIAL: 5d left  │
└─────────────────────────────────────────────────────┘
```

**[→ Live demo at agentbot.raveculture.xyz](https://agentbot.raveculture.xyz)**

---

## Quick Start

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Eskyee/agentbot-opensource?quickstart=1)

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource
cp .env.example .env        # fill in your keys
docker-compose up -d        # postgres + redis
npm install && npm run dev  # frontend on :3000
```

Backend:
```bash
cd agentbot-backend && npm install && npm run dev  # api on :3001
```

Visit `http://localhost:3000` — provision your first agent in 60 seconds.

---

## What Agents Can Do

| Capability | Description |
|-----------|-------------|
| 💬 **Multi-channel** | Telegram, Discord, WhatsApp — one agent, all channels |
| 🧠 **BYOK** | OpenRouter, Claude, GPT, Gemini, Groq, DeepSeek — your key, zero markup |
| 💰 **USDC Wallets** | Each agent has a Coinbase CDP wallet on Base — send and receive payments |
| ⚡ **x402 Micropayments** | Agents pay for APIs, content, and services autonomously |
| 🔗 **A2A Bus** | Agents message each other — SSRF-protected webhook delivery |
| 🛠 **Skill Marketplace** | Install: instant split, venue finder, booking settlement, royalty tracker, setlist oracle, visual synthesizer + more |
| 🎭 **Agent Personalities** | basement / selector / A&R / road / label — each agent gets a music-industry system prompt |
| 📧 **Email Triage** | Agents manage your inbox — filter, reply, escalate |
| 📅 **Calendar Guard** | Protect your schedule — agents negotiate on your behalf |
| 🔐 **Permission Gates** | Safe / Dangerous / Destructive tiers — you approve before agents act |
| 🎛 **Concurrent Orchestration** | Parallel tool execution — read-only ops run simultaneously |
| 🔑 **Passkeys** | WebAuthn passkey login — no passwords required |
| 🆓 **Free Trial** | 7-day trial on signup — no card required |
| 🌐 **Agent Showcase** | Opt-in public showcase — let the community discover your agents |
| 🌉 **Agent Bridge** | Private A2A message bus for coordination across your fleet |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    AGENTBOT PLATFORM                         │
│                                                              │
│  Next.js Frontend        Express Backend (TypeScript)        │
│  ├── Dashboard           ├── Provisioning API               │
│  ├── Permission Gates    ├── Container Manager (Docker)      │
│  ├── Maintenance         ├── Agent-to-Agent Bus              │
│  └── Marketplace         └── Orchestration Engine            │
│                                                              │
│  PostgreSQL (Prisma)     Redis (sessions, state)             │
└──────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │  OpenClaw   │  │  OpenClaw   │  │  OpenClaw   │
     │  Container  │  │  Container  │  │  Container  │
     │  Agent A    │  │  Agent B    │  │  Agent C    │
     └─────────────┘  └─────────────┘  └─────────────┘
        Telegram          Discord          WhatsApp
        USDC Wallet        Skills           Memory
```

Caddy reverse proxy routes `agent-name.agents.yourdomain.com` to each container. Each agent gets its own subdomain, workspace, and channel config.

---

## Powered by OpenClaw

Agentbot is a managed hosting layer for the [OpenClaw](https://github.com/OpenClaw/openclaw) agent runtime. OpenClaw handles the agent loop — tool calling, memory, channel I/O, skill execution. Agentbot handles provisioning, billing, multi-tenancy, and the management dashboard.

**Runtime:** `openclaw/openclaw:2026.4.1` — managed shared gateway at `openclaw-gw-ui-production.up.railway.app`

```bash
# Agents can self-check for updates
curl -s https://api.github.com/repos/Eskyee/agentbot-opensource/releases/latest \
  | jq '.tag_name'
```

If you're building on OpenClaw directly, Agentbot gives you a production-ready management layer without building infra from scratch.

---

## Plans

| Plan | Price | Memory | CPUs | Description |
|------|-------|--------|------|-------------|
| **Underground** | £29/mo | 2GB | 1 | Solo artist — one agent, full power |
| **Collective** | £69/mo | 4GB | 2 | Small crew — 3 agents coordinating |
| **Label** | £149/mo | 8GB | 4 | Full operation — 10 agents, A2A fleet |

All plans include: USDC wallet, skill marketplace, passkey auth, 7-day free trial.

Self-hosting? Run unlimited agents at cost. The platform is MIT licensed — no restrictions.

---

## Security

- 🔒 Bearer token auth with `timingSafeEqual` — fail-closed on all protected routes
- 🔑 SHA-256 hashed API keys — raw keys never stored or logged
- 🌐 SSRF blocklist — IPv4 private + IPv6 ULA + mapped IPv4 + CGN
- ⚡ Ed25519 Discord webhook verification
- 🛡 Tiered permission system — agents ask before executing dangerous commands
- 🐚 `spawn()` not `exec()` — no shell injection vectors
- 🔐 AES-256-GCM encrypted per-user secrets

---

## Research & Education

Agentbot implements several patterns that may be of interest to researchers and students:

| Pattern | Where |
|---------|-------|
| **Concurrent tool orchestration** | Read-only tools batched via `Promise.all`, mutating ops serial |
| **Tiered agent permissions** | Safe / Dangerous / Destructive classification at runtime |
| **Agent-to-Agent bus** | SSRF-protected webhook delivery between isolated containers |
| **x402 micropayment protocol** | Agents paying APIs autonomously over Base / USDC |
| **Multi-tenant Docker isolation** | Per-agent containers with resource limits and subdomain routing |
| **Deterministic permission gates** | Human-in-the-loop approval for dangerous tool calls |

We welcome academic collaboration. If you're researching multi-agent systems, autonomous AI orchestration, or AI economics — open an issue or join the Discord.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS |
| Components | shadcn/ui — dark minimal |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Containers | Docker (per-agent isolation) |
| Proxy | Caddy (subdomain routing) |
| Agent Runtime | OpenClaw |
| Payments | Stripe (subscriptions) + Coinbase CDP (agent wallets) |
| AI | OpenRouter, Anthropic, OpenAI, Gemini, Groq, DeepSeek |

---

## Project Structure

```
├── web/                     # Next.js frontend (Vercel)
│   ├── app/
│   │   ├── dashboard/       # Agent management UI
│   │   ├── api/             # API routes (provision, agents, billing...)
│   │   └── components/      # Shared UI components
│   └── prisma/              # Database schema + migrations
├── agentbot-backend/        # Express API (Render / Docker)
│   └── src/
│       ├── routes/          # API endpoints
│       ├── services/        # Business logic
│       └── lib/             # Utilities (SSRF, permissions, orchestration)
├── docker-compose.yml       # Local dev infrastructure
└── render.yaml              # Render deployment config
```

---

## Contributing

Pull requests welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Good first issues: docs improvements, new skill integrations, additional channel adapters, UI components.

If you're building something on top of Agentbot or OpenClaw, let us know in the Discord — we'll feature it.

---

## Community

- 💬 [Discord](https://discord.gg/eskyee) — agents and humans welcome
- 🐛 [Issues](https://github.com/Eskyee/agentbot-opensource/issues)
- 📖 [Docs](https://docs.agentbot.raveculture.xyz)
- 🚀 [Hosted Platform](https://agentbot.raveculture.xyz)
- 📦 [Releases](https://github.com/Eskyee/agentbot-opensource/releases)
- 📝 [Changelog](./CHANGELOG.md)

---

<div align="center">

MIT License · Built by [raveculture](https://github.com/Eskyee) · Powered by [OpenClaw](https://github.com/OpenClaw/openclaw)

</div>
