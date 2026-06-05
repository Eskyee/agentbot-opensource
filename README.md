# Agentbot

**Deploy AI workers. Build underground systems.**

<div align="center">

<img src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeigkpl3kax3x5wpx4xyyfldhyq6hqcwlihz5ku4cxc4ltufow4osyi" alt="Agentbot" width="900" />

[![Runtime](https://img.shields.io/badge/runtime-OpenClaw_2026.6.1-EF6F2E)](https://github.com/OpenClaw/openclaw)
[![Website](https://img.shields.io/badge/site-agentbot.sh-black)](https://agentbot.sh)
[![Docs](https://img.shields.io/badge/docs-live-EF6F2E)](https://agentbot.sh/documentation)
[![License: MIT](https://img.shields.io/badge/license-MIT-white)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-Join%20chat-5865F2?logo=discord&logoColor=white)](https://discord.gg/vTPG4vdV6D)

[**Website**](https://agentbot.sh) · [**Documentation**](https://agentbot.sh/documentation) · [**Releases**](https://github.com/Eskyee/agentbot-opensource/releases) · [**Discord**](https://discord.gg/vTPG4vdV6D) · [**Open Source Repo**](https://github.com/Eskyee/agentbot-opensource)

</div>

---

This repository contains the live product code for **Agentbot**: AI worker infrastructure, underground creator systems, and autonomous media culture. It manages agent identity, execution, OpenGateway inference, playground publishing, GitLawb mirroring, and the Creator Console.

Agentbot is not another generic AI platform. It is infrastructure for autonomous underground creator systems.

## Platform Direction

- **Factory AI Unified:** High-energy "Factory Orange" aesthetic (#EF6F2E).
- **Fact-Based Backend:** Cryptographically verified identity and state mirroring.
- **Production Private Cloud:** Managed Railway runtimes for total data sovereignty.
- **AI Gateway Mastery:** Ultra-performance inference via Vercel AI Gateway + MiMo V2.5 Pro.
- **Creator Console:** Underground arrangement agents, soundpack manifests, baseFM prompts, and visual systems.

## What's New — v1.2.0

Base ecosystem integration, Model Context Protocol, and the crash that taught us everything.

- **Builder Codes** — all wallet transactions include `bc_4k0319ta` for Base dashboard attribution
- **NFT Wristbands** — ERC-721 community access (mint, gasless mint via CDP Paymaster)
- **Token Swaps** — CDP Trade API (ETH, USDC, WETH, DEGEN, AERO on Base)
- **Sign in with Base** — wallet authentication via `@base-org/account`
- **Free Tier** — 5 free AI messages/day for Base wallet users
- **MCP Server** — Model Context Protocol integration for AI assistants
- **AskAtlas** — MiMo-powered support chatbot
- **Crash fixes** — provider boundary violations, dangling JSX, hydration errors

[Read the full release →](https://github.com/Eskyee/agentbot-opensource/releases/tag/v1.2.0)

## What Lives Here

- `web/`
  Next.js 16 app powering the Factory dashboard and APIs.
- `agentbot-backend/`
  High-performance Node/Hono services for identity and state management.
- `gateway/`
  Managed multi-platform communication bridge (x402 protocol).
- `mintlify-docs/`
  Docs source for the Factory protocol.
- `skills/`
  Managed skill library including Bitcoin, Liquid, and Social integrations.
- `soul/`
  Borg-7139 soul host and cognitive architecture logic.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React, Tailwind CSS, Wagmi/Viem |
| **Backend** | Node.js, Hono, Prisma + PostgreSQL (Neon) |
| **Auth** | NextAuth, Base wallet, Google OAuth |
| **AI** | MiMo V2.5 Pro (direct API), OpenRouter (fallback) |
| **Payments** | Stripe, x402 protocol |
| **Infra** | Vercel (frontend), Railway (backend), Neon (DB) |
| **Blockchain** | Base L2, CDP Trade API, CDP Paymaster |

## Production Surfaces

- **Main Site:** `https://agentbot.sh`
- **Ops Command Center:** `https://agentbot.sh/admin` (Live Data)
- **Agentbot Coach:** `https://agentbot.sh/dashboard/coach` (New Operator Training)
- **Bitcoin Dashboard:** `https://agentbot.sh/dashboard/bitcoin` (Mainnet Active)
- **Fleet Control:** `https://agentbot.sh/dashboard/fleet`

## Pricing

| Plan | Price | Agents | What You Get |
|------|-------|--------|-------------|
| **Free (BYOK)** | £0 | 1 | Bring your own MiMo key. 5 msgs/day. No platform fee. |
| **Solo** | £29/mo | 1 | All channels. 24/7 operation. MiMo included. |
| **Collective** | £69/mo | 3 | Priority support. Multi-agent orchestration. |
| **Label** | £149/mo | 10 | Custom skills. API access. White-label ready. |
| **Network** | £499/mo | Unlimited | Dedicated support. Full platform access. |

## Technical Standards

- **Identity:** `SignatureGuard` enforced across all backend routes. `signedFetch` (DID-native) on frontend.
- **Infrastructure:** 100% Railway-native. Render references purged.
- **Model:** `xiaomi/mimo-v2.5-pro` via Vercel AI Gateway.
- **Persistence:** SQL State + Gitlawb Fact Mirroring.
- **Performance:** Centralized Redis caching and parallel data orchestration.

## Local Development

### Quick Start

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### All Commands

```bash
npm run dev     # Parallel dev environment
npm run build   # Turbo-orchestrated full build
npm run start   # Start production server
npm run demo    # Local Agentbot demo at http://127.0.0.1:3007
npm run test    # Identity and Logic verification
```

## Creator Toolkit

The underground creator layer lives at:

- `/creator-toolkit` — public toolkit, prompt library, producer agents, soundpack structure
- `/dashboard/creator` — Creator Console with the first Arrangement Agent
- `/api/creator-toolkit/arrangement` — deterministic Break Architect arrangement output
- `/api/creator-toolkit/producer-brief` — compiled agent prompts for model calls
- `/api/creator-toolkit/soundpack` — downloadable soundpack and marketplace manifest

## Node Identity

| Metric | Value |
|--------|-------|
| **DID** | `did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY` |
| **Network** | alpha |
| **Protocols** | `git-smart-http`, `mcp`, `libp2p` |
| **Gitlawb** | [z6MkpUq1](https://gitlawb.com/node/repos/z6MkpUq1/) |

## Key Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — The Fact-Based Backend
- [docs/BASE_INTEGRATION.md](./docs/BASE_INTEGRATION.md) — Builder Codes, NFTs, swaps (900+ lines)
- [docs/MCP_SETUP.md](./docs/MCP_SETUP.md) — Model Context Protocol integration
- [SECURITY.md](./SECURITY.md) — SignatureGuard and DID Protocol
- [PLATFORM_RULES.md](./PLATFORM_RULES.md) — Operational guidelines

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

**Before submitting:** run `npx tsc --noEmit` to verify TypeScript compiles clean.

## License

MIT

---

**Mirrored on [gitlawb](https://gitlawb.com/z6MkpUq1)** — decentralized content-addressed storage

| | |
|---|---|
| **DID** | `did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY` |
| **Node** | https://node.gitlawb.com |
| **Repo** | `gitlawb://z6MkpUq1.../agentbot-opensource` |
| **Mirrored** | Every push to `main` auto-syncs via gitlawb remote |
