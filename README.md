# Agentbot

**Private production repository for Agentbot.**

<div align="center">

<img src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeibstpvk6pqo23ks3vork3yzr6ns5mdeltkv5snrkpgxn3j6pkgoau" alt="Agentbot" width="900" />

[![Runtime](https://img.shields.io/badge/runtime-OpenClaw_2026.4.7-blue)](https://github.com/OpenClaw/openclaw)
[![Website](https://img.shields.io/badge/site-agentbot.sh-black)](https://agentbot.sh)
[![Docs](https://img.shields.io/badge/docs-live-0ea5e9)](https://docs.agentbot.raveculture.xyz)
[![Discord](https://img.shields.io/badge/Discord-Join%20chat-5865F2?logo=discord&logoColor=white)](https://discord.gg/vTPG4vdV6D)

[**Website**](https://agentbot.sh) · [**Docs**](https://docs.agentbot.raveculture.xyz) · [**Discord**](https://discord.gg/vTPG4vdV6D) · [**Open Source Repo**](https://github.com/Eskyee/agentbot-opensource)

</div>

---

This repository contains the live product code for Agentbot: the managed dashboard, billing, provisioning, support, analytics, trading, and operations surfaces around the OpenClaw runtime.

If you want the public architecture and contributor-facing codebase, use:

- [Eskyee/agentbot-opensource](https://github.com/Eskyee/agentbot-opensource)

This repo is the internal production layer.

## What Lives Here

- `web/`
  Next.js app powering `agentbot.sh`
- `agentbot-backend/`
  legacy and support backend services
- `gateway/`
  gateway-related deployment/runtime code
- `mintlify-docs/`
  docs site source for `docs.agentbot.raveculture.xyz`
- `skills/`
  bundled and managed skill definitions
- `scripts/`
  operational scripts, deployment helpers, and maintenance utilities
- `docs/`
  internal runbooks, audits, and platform notes

## Production Surfaces

- Site: `https://agentbot.sh`
- Docs: `https://docs.agentbot.raveculture.xyz`
- Dashboard: `https://agentbot.sh/dashboard`
- Support: `https://agentbot.sh/dashboard/support`
- Maintenance: `https://agentbot.sh/dashboard/maintenance`
- Showcase: `https://agentbot.sh/showcase`

## Product Scope

Agentbot provisions and manages OpenClaw agents with:

- managed Railway runtimes
- Vercel-hosted dashboard and APIs
- Stripe billing and trials
- Coinbase/Base wallet flows
- channel integrations
- Bankr trading and profile flows
- fleet, colony, and support diagnostics
- showcase and community features

## Local Development

### Web app

```bash
cd web
npm install
npm run build
npm run start
```

The production runtime path is:

```bash
node .next/standalone/server.js
```

### Useful commands

```bash
cd web
npm run dev
npm run build
npm test
npm audit --json
```

## Deployment Notes

- Vercel hosts the main web product
- Railway hosts managed OpenClaw runtimes and gateway surfaces
- Mintlify hosts the developer docs site
- Canonical public domain is `agentbot.sh`

## Key Internal Docs

- [docs/CURRENT_PLATFORM_STATE.md](./docs/CURRENT_PLATFORM_STATE.md)
- [docs/INCIDENT_RESPONSE.md](./docs/INCIDENT_RESPONSE.md)
- [SECURITY.md](./SECURITY.md)
- [PLATFORM_RULES.md](./PLATFORM_RULES.md)
- [AGENTS.md](./AGENTS.md)

## Vercel Agent

This repository is configured for Vercel Agent review with a root [AGENTS.md](./AGENTS.md).

Recommended setup:

- enable Vercel Agent
- enable Code Review for this repository
- include private repositories
- enable draft reviews only if you want early feedback during WIP

Useful PR comments:

- `@vercel run a review`
- `@vercel fix the type errors`
- `@vercel why is this failing?`

Current review priorities:

- provisioning and Prisma state consistency
- dashboard data integrity
- runtime and version drift
- auth, session, webhook, and token security
- Vercel build/runtime regressions

## Open Source Repo

The open-source version is the right place for:

- architecture overviews
- public CI signals
- contributor onboarding
- community issues and feature requests

Go to:

- [github.com/Eskyee/agentbot-opensource](https://github.com/Eskyee/agentbot-opensource)

## License

MIT
