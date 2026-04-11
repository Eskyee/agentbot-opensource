<div align="center">

# Agentbot Open Source

**Open-source social agents for X.**
Build a narrow agent workflow that monitors mentions, drafts replies and threads, detects high-signal opportunities, and routes actions into approvals or x402-powered monetization.

[![CI](https://github.com/Eskyee/agentbot-opensource/actions/workflows/ci.yml/badge.svg)](https://github.com/Eskyee/agentbot-opensource/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](./LICENSE)
[![OpenClaw](https://img.shields.io/badge/runtime-OpenClaw_2026.4.5-blue)](https://github.com/OpenClaw/openclaw)
[![Release](https://img.shields.io/github/v/release/Eskyee/agentbot-opensource)](https://github.com/Eskyee/agentbot-opensource/releases)
[![Discord](https://img.shields.io/discord/1234567890?label=Discord&color=5865F2)](https://discord.gg/eskyee)

![Agentbot Banner](https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafkreiec4xih75nginbmhmicbk3t5i4amubxbndil2ntzpiupsmj2mlwpy)

[**Private Cloud**](https://agentbot.sh) · [**Docs**](https://docs.agentbot.raveculture.xyz) · [**Discord**](https://discord.gg/eskyee) · [**Releases**](https://github.com/Eskyee/agentbot-opensource/releases) · [**DeepWiki**](https://deepwiki.com/Eskyee/agentbot-opensource/1-agentbot-overview)

</div>

---

`agentbot-opensource` is the public growth repo for Agentbot.

Use it when you want:

- a forkable starter
- a self-host path
- public architecture
- contributor-facing issues and docs
- a narrow, working workflow for X-native social agents

If you want the full managed product with private-cloud operations, billing, approvals, provisioning, and production dashboards, use the private product at [agentbot.sh](https://agentbot.sh).

## Two Paths

### 1. Use Agentbot Private Cloud

Use the managed product when you want:

- private-cloud deployment
- approvals and operator controls
- dashboard and command center UX
- billing, onboarding, and production operations
- a faster path to real usage

### 2. Self-Host With Open Source

Use this repo when you want:

- source access
- self-hosting
- your own workflows and prompts
- developer visibility into the stack
- a clean starting point for experimentation and extensions

## What This Starter Does

This repo is optimized around one clear workflow:

1. monitor X mentions or selected keywords
2. classify the incoming signal
3. draft a reply or thread
4. route the action into approval
5. trigger a monetization or conversion step when useful

Core capabilities:

- mention monitoring
- keyword watching
- reply drafting
- thread drafting
- opportunity detection
- approval queue foundations
- x402 / Base-native action hooks

## Demo Flow

```text
mention arrives
  -> agent scores signal
  -> draft reply generated
  -> operator approves or edits
  -> post or trigger action
  -> optional x402 payment / booking / paid API step
```

This is intentionally narrower than a full social network.
The goal is a useful X-native agent workflow, not an agent-only feed.

## Quick Start

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource
cp .env.example .env
docker-compose up -d
npm install
npm run dev
```

Backend:

```bash
cd agentbot-backend
npm install
npm run dev
```

Then open the local app and run one workflow end to end:

- connect your X credentials
- configure a keyword or mention watch
- generate a draft
- review it
- trigger the next action

## Architecture

```text
ingestion
  -> X mentions / keyword watch

decision layer
  -> classify signal
  -> score intent
  -> choose reply / thread / no-op

approval layer
  -> review queue
  -> human approval for public actions

action layer
  -> publish
  -> log event
  -> optional x402 conversion step
```

Under the hood, Agentbot is built around the [OpenClaw](https://github.com/OpenClaw/openclaw) runtime plus the management surfaces needed to turn agents into a usable product.

## Why This Repo Exists

This public repo is where we optimize for:

- clarity
- stars
- contributors
- docs
- self-host trust

The private repo is where we optimize for:

- shipping the managed product
- private-cloud operations
- billing and approvals
- customer support
- reliability

## Managed Product

The managed product wraps the same core ideas in a production private-cloud control plane:

- hosted dashboard
- approvals and operator workflow
- provisioning
- billing
- observability
- account-level operations

Use:

- [agentbot.sh](https://agentbot.sh)

## What Agents Can Do

| Capability | Description |
|-----------|-------------|
| **Monitor** | Watch mentions, keywords, and selected conversations on X |
| **Draft** | Generate replies and thread drafts quickly |
| **Detect** | Surface leads, support requests, and high-signal opportunities |
| **Approve** | Keep humans in the loop before public posting |
| **Monetize** | Connect actions to x402 and Base-native payment flows |
| **Extend** | Add skills, custom prompts, and domain-specific workflows |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Runtime | OpenClaw |
| Payments | x402, Stripe, Base wallet flows |
| AI | OpenRouter, Anthropic, OpenAI, Gemini, Groq, DeepSeek |

## Repo Structure

```text
├── web/                     # Next.js app and API routes
├── agentbot-backend/        # backend APIs and support services
├── docs/                    # public architecture and operational docs
├── skills/                  # reusable skill definitions
└── scripts/                 # local tooling and helpers
```

## Contributing

Pull requests are welcome.

Best contribution targets:

- docs clarity
- X workflow integrations
- approval UX
- skills and adapters
- starter templates
- example workflows

## Community

- [Discord](https://discord.gg/eskyee)
- [Issues](https://github.com/Eskyee/agentbot-opensource/issues)
- [Docs](https://docs.agentbot.raveculture.xyz)
- [Hosted Product](https://agentbot.sh)
- [Releases](https://github.com/Eskyee/agentbot-opensource/releases)

## License

MIT
