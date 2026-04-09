---
title: Building a SaaS Platform with Factory Droid — From Zero to Production
published: true
description: How one developer ships an AI agent platform at startup speed using custom droids as a virtual engineering team.
tags: factorydroid, saas, ai, buildinpublic
cover_image: https://agentbot.raveculture.xyz/blog/factory-droid-cover.jpg
canonical_url: https://agentbot.sh/blog/posts/building-saas-with-factory-droid
---

![Three AI droids — provisioner, skill-builder, and user-manager — connected to a central SaaS dashboard](https://agentbot.raveculture.xyz/blog/factory-droid-cover.jpg)

## The Problem: One Dev, Entire Platform

Agentbot is a SaaS platform that provisions autonomous AI agent containers for the music and culture industry. Users sign up, pick a plan, and get a dedicated OpenClaw agent running on Railway in under 60 seconds. Behind that simple flow sits a Next.js frontend, an Express backend, Prisma ORM, Stripe billing, Railway container orchestration, 40+ API routes, and a skill marketplace with 45+ installable capabilities.

I build it solo. No co-founder, no engineering team. Just me and Factory Droid.

![Solo developer at a futuristic desk with holographic AI screens](https://agentbot.raveculture.xyz/blog/factory-droid-solo-dev.jpg)

## What is Factory Droid?

[Factory Droid](https://factory.ai) is an AI coding agent that lives in your terminal. It reads your codebase, understands your conventions, and executes multi-step engineering tasks. Think of it as a senior engineer who never sleeps, never forgets your auth patterns, and can spin up parallel workers for independent tasks.

The real power is **custom droids** — you write a markdown spec that teaches the AI your specific domain, and it becomes a specialist.

## Our Custom Droid Fleet

![Three AI robot droids with neon purple and green glow](https://agentbot.raveculture.xyz/blog/factory-droid-droids-fleet.jpg)

We run three custom droids in our `.factory/droids/` directory, each tuned for a different slice of the platform:

### agent-provisioner

Knows the entire provisioning pipeline: auth gates, subscription checks, workload slots, Railway API calls, container resource limits per plan tier, OpenClaw env injection, health polling.

*Used for: deploying new agents, debugging failed provisions, scaling containers, managing Railway services*

### skill-builder

Understands the skill marketplace: Prisma Skill model, install/uninstall lifecycle, OpenClaw gateway deployment, skill categories, the 45+ default skills, and MCP tool proxying.

*Used for: creating new skills, wiring skill APIs, debugging gateway deploys, marketplace catalog management*

### user-manager

Handles the full user lifecycle: NextAuth multi-provider auth, registration with BotID protection, Stripe subscription tiers, 7-day trials, referral credits, admin access, email automation.

*Used for: debugging signups, subscription management, referral system, admin operations*

## How a Custom Droid Works

A custom droid is just a markdown file in `.factory/droids/`. Here is the structure:

```markdown
---
name: agent-provisioner
description: >-
  Provision, debug, and manage Agentbot AI agent
  containers. Use when deploying new agents,
  troubleshooting failed provisions, or managing
  the full agent lifecycle.
model: inherit
---
# Agent Provisioner Droid

You are an expert at provisioning and managing
Agentbot AI agent containers running the OpenClaw
runtime on Railway infrastructure.

## Key Files
- web/app/api/provision/route.ts
- agentbot-backend/src/lib/container-manager.ts
- web/prisma/schema.prisma

## Plan Tiers
| Plan | CPU | Memory | Price |
|------|-----|--------|-------|
| solo | 1 vCPU | 2 GB | £29/mo |
...
```

That is it. The droid reads the frontmatter for routing, then the body gives it domain expertise. When you or another droid spawns it as a subagent, it already knows your file paths, your data models, your security rules, and your common failure modes. No prompt engineering on every request.

## The Daily Workflow

![Futuristic code workflow terminal with neon holographic displays](https://agentbot.raveculture.xyz/blog/factory-droid-workflow.jpg)

Here is what a typical day looks like building Agentbot with Factory Droid:

| Time | Task |
|------|------|
| 08:00 | **"Wire Solana dashboard with real data"** — Droid creates 3 API routes, rewrites the dashboard page, no new dependencies |
| 08:45 | **"Review the whole site for bugs"** — Spawns 2 parallel workers, returns 39 findings across 5 severity levels |
| 09:30 | **"Create OpenClaw 2026.4.9 dashboards"** — 3 new dashboard pages + blog post + API proxy routes, all committed |
| 10:15 | **"Study Kilo-Org/cloud and improve our UX"** — Deep competitor analysis, then implements StatusBadge, ConfirmDialog, toast system, 4 email templates |
| 11:00 | **"Write MiMo sponsorship pitch"** — Production case study blog + outreach strategy document, ready to send |

That is five major features before lunch. Each one verified with `npm run build`, committed to git, deployed to Vercel. Factory Droid handles the build verification itself — if TypeScript fails, it fixes the errors and re-runs.

## What Makes It Work

**Convention over configuration** — Droid reads your AGENTS.md, CLAUDE.md, and existing code. It matches your patterns — if you use Zod for validation, it uses Zod. If you use sonner for toasts, it uses sonner. No style drift.

**Parallel workers** — For independent tasks, Droid spawns background agents. Code review runs in parallel with API route creation. Two workers scanning different parts of the codebase simultaneously.

**Build-first verification** — Every change gets `npm run build` before commit. TypeScript errors are caught and fixed automatically. No broken deployments pushed to main.

**Domain expertise via custom droids** — The provisioner droid knows Railway GraphQL. The skill droid knows OpenClaw gateway ports. The user droid knows BotID protection. Specialisation beats general knowledge.

## By the Numbers

| Metric | Count |
|--------|-------|
| API routes | 120+ |
| Marketplace skills | 45+ |
| Custom droids | 3 |
| Developer | 1 |

## Getting Started with Custom Droids

If you are building a SaaS and want to try this workflow:

1. **Install Factory Droid** — follow the setup at [factory.ai](https://factory.ai)
2. **Write your AGENTS.md** — document your project structure, conventions, and key files. This is the foundation Droid reads on every session.
3. **Create your first custom droid** — pick the most complex subsystem in your app (auth, billing, deployment) and write a specialist droid for it. Put it in `.factory/droids/your-droid.md`.
4. **Build in natural language** — describe what you want. "Wire the dashboard to real data." "Debug why provision fails for trial users." "Create a blog post about our latest release."
5. **Let it verify** — Droid runs your build, catches errors, fixes them. You review the diff and merge.

## The Real Talk

Factory Droid is not magic. You still need to understand your architecture. You still need to review diffs. You still need to know when the AI is confidently wrong. But it collapses a 10-person engineering sprint into a morning session for one developer. That is the difference between shipping and not shipping.

Every feature on Agentbot — the skill marketplace, the buddies system, the Solana integration, the OpenClaw dashboards, the email automation, the conference recap blog posts — was built in this workflow. Describe, verify, ship.

We are building in public because the tooling deserves it. If you are a solo founder or a small team shipping fast, this is the workflow. Custom droids are the unfair advantage.

---

Agentbot is open source at [github.com/Eskyee/agentbot](https://github.com/Eskyee/agentbot). Our custom droids are in the repo under `.factory/droids/`. Try Factory Droid at [factory.ai](https://factory.ai).
