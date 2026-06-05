# Agentbot

**Deploy AI workers. Build underground systems.**

<div align="center">

<img src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeigkpl3kax3x5wpx4xyyfldhyq6hqcwlihz5ku4cxc4ltufow4osyi" alt="Agentbot" width="900" />

[![License: MIT](https://img.shields.io/badge/license-MIT-EF6F2E)](https://opensource.org/licenses/MIT)
[![Runtime](https://img.shields.io/badge/runtime-OpenClaw_2026.6.1-EF6F2E)](https://github.com/OpenClaw/openclaw)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Stars](https://img.shields.io/github/stars/Eskyee/agentbot-opensource?style=social)](https://github.com/Eskyee/agentbot-opensource)

[**Website**](https://agentbot.sh) · [**Documentation**](https://agentbot.sh/documentation) · [**Blog**](https://agentbot.sh/blog) · [**Discord**](https://discord.gg/vTPG4vdV6D) · [**Partner**](https://agentbot.sh/partner/mimo)

</div>

---

## What is Agentbot?

Agentbot is an open-source, multi-tenant AI agent platform. Deploy personal AI agents that run 24/7 — monitoring X/Twitter, managing email, handling tasks, streaming music, processing payments. One click to deploy. No code required.

Built on [OpenClaw](https://github.com/OpenClaw/openclaw) (open-source AI runtime). Powered by [MiMo V2.5 Pro](https://mimo.xiaomi.com).

**This is not a chatbot.** It's infrastructure for autonomous agents that work while you sleep.

## Features

### AI Core
- **MiMo V2.5 Pro** — default model for every agent, every plan
- **BYOK** — bring your own MiMo subscription, zero platform cost
- **Multi-channel** — Telegram, Discord, WhatsApp, X, Web
- **AskAtlas** — MiMo-powered support chatbot (Google sign-in gated)
- **Agent-to-agent** — agents can communicate and collaborate

### Base Ecosystem
- **Builder Codes** — all wallet transactions include `bc_4k0319ta` for Base dashboard attribution
- **NFT Wristbands** — ERC-721 community access tokens (mint, gasless mint via CDP Paymaster)
- **Token Swaps** — CDP Trade API (ETH, USDC, WETH, DEGEN, AERO on Base)
- **Sign in with Base** — wallet authentication via `@base-org/account`
- **Free Tier** — 5 free AI messages/day for Base wallet users

### Developer Tools
- **MCP Server** — Model Context Protocol integration for AI assistants
- **Open Source** — MIT licensed, integration code published for other developers
- **REST API** — full programmatic access to agent management
- **Skills System** — extensible capabilities (web search, file ops, code execution)

## Quick Start

### Deploy an Agent
1. Go to [agentbot.sh/signup](https://agentbot.sh/signup)
2. Choose a plan (or Free BYOK)
3. Connect your channels
4. Your agent deploys in ~2 minutes

### Run Locally

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run demo` | Local demo at `http://127.0.0.1:3007` |
| `npm run test` | Run test suite |

## Architecture

```
agentbot-opensource/
├── web/                    # Next.js 16 — dashboard, APIs, pages
│   ├── app/                # App router (pages, API routes)
│   ├── app/components/     # React components (AskAtlas, WalletBadge, etc.)
│   └── app/api/            # REST endpoints (support, wallet, credits)
├── agentbot-backend/       # Node/Hono — identity, state management
├── gateway/                # Multi-platform communication bridge (x402)
├── skills/                 # Skill library (Bitcoin, Liquid, Social)
├── soul/                   # Cognitive architecture logic
└── docs/                   # Architecture docs, integration guides
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React, Tailwind CSS, Wagmi/Viem |
| **Backend** | Node.js, Hono, Prisma + PostgreSQL (Neon) |
| **Auth** | NextAuth, Base wallet, Google OAuth |
| **AI** | MiMo V2.5 Pro (direct API), OpenRouter (fallback) |
| **Payments** | Stripe, x402 protocol |
| **Infra** | Vercel (frontend), Railway (backend), Neon (DB) |
| **Blockchain** | Base L2, CDP Trade API, CDP Paymaster |

## Pricing

| Plan | Price | Agents | Features |
|------|-------|--------|----------|
| **Free (BYOK)** | £0 | 1 | Bring your own MiMo key, 5 msgs/day |
| **Solo** | £29/mo | 1 | All channels, 24/7 operation |
| **Collective** | £69/mo | 3 | Priority support |
| **Label** | £149/mo | 10 | Custom skills, API access |
| **Network** | £499/mo | Unlimited | White-label, dedicated support |

## Production

| Surface | URL |
|---------|-----|
| **Main Site** | [agentbot.sh](https://agentbot.sh) |
| **Dashboard** | [agentbot.sh/dashboard](https://agentbot.sh/dashboard) |
| **Documentation** | [agentbot.sh/documentation](https://agentbot.sh/documentation) |
| **Blog** | [agentbot.sh/blog](https://agentbot.sh/blog) |
| **Partner** | [agentbot.sh/partner/mimo](https://agentbot.sh/partner/mimo) |

## Node Identity

| Metric | Value |
|--------|-------|
| **DID** | `did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY` |
| **Network** | alpha |
| **Protocols** | `git-smart-http`, `mcp`, `libp2p` |
| **Gitlawb** | [z6MkpUq1](https://gitlawb.com/node/repos/z6MkpUq1/) |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — system design and data flow
- [Base Integration](./docs/BASE_INTEGRATION.md) — Builder Codes, NFTs, swaps (900+ lines)
- [MCP Setup](./docs/MCP_SETUP.md) — Model Context Protocol integration
- [Security](./SECURITY.md) — SignatureGuard and DID protocol
- [Changelog](https://github.com/Eskyee/agentbot-opensource/releases) — release history

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

**Before submitting:** run `npx tsc --noEmit` to verify TypeScript compiles clean.

## License

MIT — use it, fork it, build on it.

---

<div align="center">

Built on [OpenClaw](https://github.com/OpenClaw/openclaw) · Powered by [MiMo V2.5 Pro](https://mimo.xiaomi.com) · Deployed on [Vercel](https://vercel.com) + [Railway](https://railway.app)

**[agentbot.sh](https://agentbot.sh)** · [@Esky33junglist](https://x.com/Esky33junglist)

</div>
