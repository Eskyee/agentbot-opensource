# Agentbot

**Multi-tenant AI agent platform.** Provision, manage, and orchestrate AI agents with Docker isolation, channel integration, and a clean design system.

![CI](https://github.com/Eskyee/agentbot-opensource/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)


[DeepWikiEskyee/agentbot-opensource](https://deepwiki.com/Eskyee/agentbot-opensource/1-agentbot-overview)

---

## What is Agentbot?

Agentbot is a platform for deploying and managing AI agents at scale. Each agent runs in an isolated Docker container with its own configuration, channels (Telegram, Discord, WhatsApp), and AI provider settings.

**Key features:**
- 🐳 **Docker-isolated agents** — each agent gets its own container with resource limits
- 💬 **Multi-channel** — Telegram, Discord, WhatsApp out of the box
- 🤖 **Multi-provider** — OpenRouter, Gemini, Groq, Anthropic, OpenAI
- 🎨 **Design system** — shadcn/ui + Tailwind CSS with a dark minimal aesthetic
- 💳 **Plan-based provisioning** — Solo, Collective, Label, Network tiers
- 🔌 **Plugin architecture** — extend agent capabilities via installable skills

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js 15 + Tailwind CSS)       │
│  ├── Dashboard (agent management)            │
│  ├── Onboarding (provisioning wizard)        │
│  └── Design System (shadcn/ui components)    │
├─────────────────────────────────────────────┤
│  Backend API (Express + TypeScript)          │
│  ├── /api/provision — agent provisioning     │
│  ├── /api/agents — CRUD + lifecycle          │
│  ├── /api/deployments — Docker management    │
│  └── /health — health checks                 │
├─────────────────────────────────────────────┤
│  Data Layer                                  │
│  ├── PostgreSQL (Prisma ORM)                 │
│  └── Redis (caching, sessions)               │
├─────────────────────────────────────────────┤
│  Agent Runtime (Docker containers)           │
│  ├── OpenClaw agent runtime                  │
│  ├── Per-agent config & workspace            │
│  └── Channel plugins (Telegram/Discord/etc)  │
└─────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 3 |
| Components | shadcn/ui (base-nova style) |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Containers | Docker (per-agent isolation) |
| AI | OpenRouter, Gemini, Groq, Anthropic, OpenAI |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+
- pnpm or npm

### Local Development

```bash
# Clone the repo
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource

# Copy environment template
cp .env.example .env

# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Run database migrations
npx prisma generate
npx prisma db push

# Start the backend
cd src/server && npx ts-node index.ts

# Start the frontend (in another terminal)
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── shared/          # Agentbot-specific components
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentInput.tsx
│   │   │   ├── DashboardShell.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   └── ...
│   │   └── ui/              # shadcn/ui base components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── utils.ts         # cn(), formatCost(), formatTokens()
│   │   └── cron-parser.ts   # Natural language → cron
│   ├── types/
│   │   ├── index.ts         # AgentTask type
│   │   └── constellation.ts # Agent graph types
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── server/
│       ├── index.ts         # Express server entry
│       └── routes/
│           ├── agents.ts    # Agent CRUD + lifecycle
│           └── provision.ts # Agent provisioning
├── docs/
│   └── ARCHITECTURE.md      # Detailed architecture docs
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js
├── components.json          # shadcn/ui config
├── tsconfig.json
├── docker-compose.yml       # Local dev infrastructure
├── .env.example             # Environment template
├── BRAND_GUIDELINES.md      # Visual identity
├── DESIGN_SYSTEM.md         # Component design tokens
└── Dockerfile               # Backend container
```

## Design System

Agentbot uses a **Vercel/Geist-inspired dark minimalism** design language:

- **Dark only** — no light mode
- **Monospace everything** — Geist Mono for all UI
- **No decoration** — no gradients, no shadows, no crypto aesthetics
- **Information density** — small type, uppercase labels, generous whitespace

See [`BRAND_GUIDELINES.md`](./BRAND_GUIDELINES.md) and [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) for full details.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[MIT](./LICENSE)
