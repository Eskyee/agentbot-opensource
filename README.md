<div align="center">

# Agentbot × OpenClaw × MiMo

**The first MiMo-native AI agent platform.**

99% cheaper than GPT. 1M context. Deployed in 2 minutes.

[![CI](https://github.com/Eskyee/agentbot-opensource/actions/workflows/ci.yml/badge.svg)](https://github.com/Eskyee/agentbot-opensource/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](./LICENSE)
[![MiMo](https://img.shields.io/badge/AI-Xiaomi_MiMo_V2.5-orange)](https://huggingface.co/XiaomiMiMo)
[![OpenClaw](https://img.shields.io/badge/runtime-OpenClaw-blue)](https://github.com/OpenClaw/openclaw)
[![Discord](https://img.shields.io/discord/1234567890?label=Discord&color=5865F2)](https://discord.gg/eskyee)

![Agentbot Banner](https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafkreiec4xih75nginbmhmicbk3t5i4amubxbndil2ntzpiupsmj2mlwpy)

[**Website**](https://agentbot.raveculture.xyz) · [**Docs**](https://docs.agentbot.raveculture.xyz) · [**Discord**](https://discord.gg/eskyee) · [**Releases**](https://github.com/Eskyee/agentbot-opensource/releases) · [**DeepWiki**](https://deepwiki.com/Eskyee/agentbot-opensource/1-agentbot-overview)

</div>

---

## Why MiMo Changes Everything

Traditional AI agent platforms charge $15-60/M tokens for models that forget what you said 10 messages ago. Agentbot runs on **Xiaomi MiMo V2.5** — a reasoning-first model with:

| | GPT-4o | Claude 3.5 | **MiMo V2.5** |
|---|---|---|---|
| **Context** | 128K | 200K | **1M tokens** |
| **Cost** | $15/M input | $3/M input | **$0.15/M input** |
| **Reasoning** | Good | Good | **Best-in-class (RL-trained)** |
| **Code** | Great | Great | **Great (7B matches 32B models)** |

Agentbot connects directly to MiMo's API — no OpenRouter middleman, no markup. You bring your MiMo key, you get the full context window at native pricing.

```
Your agent. Your key. MiMo-powered. Zero markup.
```

> **🚀 Launched 31st March 2026** · **MiMo-native since June 2026** — live at [agentbot.raveculture.xyz](https://agentbot.raveculture.xyz)

---

## MiMo Integration

Agentbot is the first open-source platform built from the ground up for MiMo:

### Direct API Connection
No OpenRouter proxy tax. Agentbot connects straight to MiMo's inference endpoint for minimum latency and maximum context. Native streaming, tool calling, and function execution.

### BYOK — Bring Your Own Key
```bash
MIMO_API_KEY=your-key-here
MIMO_MODEL=mimo-v2.5
```
Your key, your billing, your data. Zero markup on token costs. Use your own MiMo API key or one provisioned through the Agentic Market.

### x402 Payment Protocol
Agents pay for APIs, content, and services autonomously using the x402 micropayment protocol over Base/USDC. MiMo's low cost makes autonomous agent economics viable for the first time — run an agent for pennies per day instead of dollars per hour.

### Agentic Market Listing
Agentbot agents are listed on the [Agentic Market](https://agentbot.raveculture.xyz/marketplace) — discover, deploy, and pay for MiMo-native agents with USDC. Each agent is a composable unit: install skills, connect channels, set permissions, go live.

---

## Dashboard

```
┌─────────────────────────────────────────────────────┐
│  AGENTBOT × MiMo                        ● CONNECTED │
├─────────────────────────────────────────────────────┤
│  AGENT: basefm-agent                                 │
│  STATUS: ACTIVE  │  UPTIME: 3d 14h  │  MiMo V2.5   │
│                                                      │
│  CHANNELS        SKILLS              WALLET          │
│  ✓ Telegram      12 installed        $247.50 USDC    │
│  ✓ WhatsApp      ▸ instant-split     Base mainnet    │
│  ✗ Discord       ▸ venue-finder                      │
│                  ▸ royalty-tracker   [OPEN AGENT]    │
│                                                      │
│  CONTEXT: 1M tokens    COST: ~$0.02/day              │
└─────────────────────────────────────────────────────┘
```

**[→ Live demo at agentbot.raveculture.xyz](https://agentbot.raveculture.xyz)**

---

## Quick Start

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource
cp .env.example .env        # add your MIMO_API_KEY
docker-compose up -d        # postgres + redis
npm install && npm run dev  # frontend on :3000
```

Backend:
```bash
cd agentbot-backend && npm install && npm run dev  # api on :3001
```

Visit `http://localhost:3000` — provision your first MiMo-powered agent in 120 seconds.

**Environment variables:**
```bash
# Required — MiMo API (direct connection, no OpenRouter)
MIMO_API_KEY=your-mimo-api-key
MIMO_MODEL=mimo-v2.5
MIMO_BASE_URL=https://api.mimo.ai/v1   # or self-hosted endpoint

# Optional — additional providers (BYOK, zero markup)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
```

---

## What Agents Can Do

| Capability | Description |
|-----------|-------------|
| 🧠 **MiMo V2.5** | 1M context, RL-trained reasoning, 99% cheaper than GPT-4o |
| 💬 **Multi-channel** | Telegram, Discord, WhatsApp — one agent, all channels |
| 🔑 **BYOK** | MiMo direct API + OpenRouter, Claude, GPT, Gemini, Groq, DeepSeek — your key, zero markup |
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
     │  MiMo V2.5  │  │  MiMo V2.5  │  │  MiMo V2.5  │
     └─────────────┘  └─────────────┘  └─────────────┘
        Telegram          Discord          WhatsApp
        USDC Wallet        Skills           Memory
```

Caddy reverse proxy routes `agent-name.agents.yourdomain.com` to each container. Each agent gets its own subdomain, workspace, channel config, and direct MiMo API connection.

---

## Powered by OpenClaw + MiMo

Agentbot is a managed hosting layer for the [OpenClaw](https://github.com/OpenClaw/openclaw) agent runtime, optimized for [Xiaomi MiMo V2.5](https://huggingface.co/XiaomiMiMo).

**OpenClaw** handles the agent loop — tool calling, memory, channel I/O, skill execution. **MiMo** provides the intelligence — 1M context window, RL-trained reasoning, and token pricing that makes autonomous agents economically viable. **Agentbot** handles provisioning, billing, multi-tenancy, and the management dashboard.

```
OpenClaw = the body (tools, memory, channels)
MiMo     = the brain (reasoning, context, planning)
Agentbot = the infrastructure (deploy, scale, manage)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI Model** | **Xiaomi MiMo V2.5** (direct API, 1M context, RL reasoning) |
| Frontend | Next.js 14, React, Tailwind CSS |
| Components | shadcn/ui — dark minimal |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Containers | Docker (per-agent isolation) |
| Proxy | Caddy (subdomain routing) |
| Agent Runtime | OpenClaw |
| Payments | Stripe (subscriptions) + Coinbase CDP (agent wallets) + x402 protocol |
| BYOK Providers | OpenRouter, Anthropic, OpenAI, Gemini, Groq, DeepSeek (zero markup) |

---

## Plans

| Plan | Price | Memory | CPUs | Description |
|------|-------|--------|------|-------------|
| **Underground** | £29/mo | 2GB | 1 | Solo artist — one agent, full power |
| **Collective** | £69/mo | 4GB | 2 | Small crew — 3 agents coordinating |
| **Label** | £149/mo | 8GB | 4 | Full operation — 10 agents, A2A fleet |

All plans include: MiMo V2.5 integration, USDC wallet, skill marketplace, passkey auth, 7-day free trial.

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
- 🔑 MiMo API keys stored encrypted, never logged or transmitted to third parties

---

## Research & Education

Agentbot implements several patterns that may be of interest to researchers and students:

| Pattern | Where |
|---------|-------|
| **MiMo-native agent orchestration** | Direct API integration with 1M context RL model |
| **Concurrent tool orchestration** | Read-only tools batched via `Promise.all`, mutating ops serial |
| **Tiered agent permissions** | Safe / Dangerous / Destructive classification at runtime |
| **Agent-to-Agent bus** | SSRF-protected webhook delivery between isolated containers |
| **x402 micropayment protocol** | Agents paying APIs autonomously over Base / USDC |
| **Multi-tenant Docker isolation** | Per-agent containers with resource limits and subdomain routing |
| **Deterministic permission gates** | Human-in-the-loop approval for dangerous tool calls |
| **Cost-optimized inference** | MiMo V2.5 pricing enables 24/7 autonomous agents at pennies/day |

We welcome academic collaboration. If you're researching multi-agent systems, autonomous AI orchestration, RL reasoning models, or AI economics — open an issue or join the Discord.

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

MIT License · Built by [raveculture](https://github.com/Eskyee) · Powered by [OpenClaw](https://github.com/OpenClaw/openclaw) + [Xiaomi MiMo](https://huggingface.co/XiaomiMiMo)

</div>
