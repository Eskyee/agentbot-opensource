# Agentbot Repo Tree (Clean)
_Generated: 2026-04-11 — for ChatGPT ecosystem mapping_

## Top-Level Structure
```
agentbot/
├── agentbot-backend/          # Node.js API backend (Express + Prisma)
├── web/                       # Next.js 14 frontend (App Router)
├── gateway/                   # OpenClaw gateway service
├── x402-tempo/                # Rust x402 payment gateway (Tempo chain)
├── x402-services/             # x402 microservices (web-summarizer)
├── btcpay-configurator/       # BTCPay Server plugin
├── chrome-extension/          # Browser extension
├── soul/                      # Agent personality definitions
├── skills/                    # OpenClaw skills
├── scripts/                   # Ops/deployment scripts
├── docs/                      # Documentation
├── data/                      # On-chain data (Solana holders)
├── memory/                    # Agent memory/learnings
├── dashboard.html             # Standalone dashboard
├── docker-compose.yml         # Docker orchestration
├── vercel.json                # Vercel config
├── render.yaml                # Render deploy config
├── turbo.json                 # Turborepo config
├── package.json               # Root monorepo
└── README.md
```

## Frontend (web/) — Next.js 14 + React 19
```
web/
├── app/
│   ├── api/                   # 80+ API route groups
│   │   ├── auth/              # NextAuth (Google, Farcaster, wallet)
│   │   ├── agents/            # Agent CRUD, provisioning, showcase
│   │   ├── bankr/             # Bankr wallet integration
│   │   ├── bitcoin/           # Bitcoin/Liquid wallet ops
│   │   ├── bridge/            # Agent-to-human messaging bridge
│   │   ├── calendar/          # Google Calendar integration
│   │   ├── colony/            # Agent colony management
│   │   ├── credits/           # Credit/pricing system
│   │   ├── cron/              # Scheduled tasks
│   │   ├── dashboard/         # Dashboard data endpoints
│   │   ├── gateway/           # OpenClaw gateway proxy
│   │   ├── generate-music/    # AI music generation
│   │   ├── generate-video/    # AI video generation
│   │   ├── jobs/              # AI agent jobs board
│   │   ├── mcp/               # Model Context Protocol
│   │   ├── orchestration/     # Multi-agent orchestration
│   │   ├── provision/         # User provisioning
│   │   ├── sandbox/           # Code sandbox
│   │   ├── sessions/          # Agent sessions
│   │   ├── skills/            # Skill marketplace (12 skills)
│   │   ├── solana/            # Solana wallet/price/verify
│   │   ├── stripe/            # Stripe billing + webhooks
│   │   ├── swarms/            # Agent swarms
│   │   ├── wallet/            # Wallet management (CDP, create, sessions)
│   │   ├── webhooks/          # Discord, Mux, Railway, Resend, Stripe, WhatsApp
│   │   ├── workflows/         # Workflow builder
│   │   └── x402/              # x402 payment gateway
│   ├── dashboard/             # 40+ dashboard pages
│   │   ├── admin/             # Admin panel
│   │   ├── agents/            # Agent management
│   │   ├── bitcoin/           # Bitcoin wallet
│   │   ├── borg/              # Borg agent control
│   │   ├── browser/           # Agent browser
│   │   ├── calendar/          # Calendar view
│   │   ├── colony/            # Colony management
│   │   ├── dj-stream/         # DJ streaming (Mux)
│   │   ├── finance/           # Financial dashboard
│   │   ├── fleet/             # Agent fleet
│   │   ├── memory/            # Agent memory browser
│   │   ├── marketplace/       # Agent marketplace
│   │   ├── sandbox/           # Code sandbox
│   │   ├── solana/            # Solana dashboard
│   │   ├── streaming/         # Live streaming
│   │   ├── swarms/            # Swarm management
│   │   ├── tasks/             # Task management
│   │   ├── team/              # Team management
│   │   ├── tempo-dex/         # Tempo DEX
│   │   ├── wallet/            # Wallet management
│   │   ├── workflows/         # Workflow builder
│   │   └── x402/              # x402 gateway
│   ├── blog/                  # 60+ blog posts
│   ├── marketplace/           # Agent marketplace page
│   ├── token/                 # $AGENTBOT token page
│   ├── playground/            # Agent playground
│   ├── showcase/              # Agent showcase
│   ├── jobs/                  # AI jobs board
│   └── use-cases/             # Use case pages (6 verticals)
├── components/                # Shared React components
├── lib/                       # Shared libraries
│   ├── blockchain/            # Blockchain utilities
│   ├── email/                 # Email (Resend)
│   ├── mpp/                   # Multi-party payments
│   ├── webauthx/              # WebAuthn/passkey auth
│   └── vector-store/          # Vector storage
├── prisma/                    # Database schema + migrations
├── store/                     # State management
├── hooks/                     # Custom React hooks
└── types/                     # TypeScript types
```

## Backend (agentbot-backend/) — Node.js + Express
```
agentbot-backend/src/
├── index.ts                   # Main entry
├── routes/
│   ├── agents.ts              # Agent management API
│   ├── ai.ts                  # AI inference routes
│   ├── openclaw.ts            # OpenClaw integration
│   ├── orchestration.ts       # Multi-agent orchestration
│   ├── provision.ts           # User provisioning
│   ├── railway-provision.ts   # Railway auto-provisioning
│   ├── registration.ts        # User registration
│   ├── team-provision.ts      # Team provisioning
│   ├── platform-jobs.ts       # Platform job management
│   └── metrics.ts             # Metrics/analytics
├── services/
│   ├── ai.ts                  # AI service layer
│   ├── ai-provider.ts         # Multi-provider AI (OpenRouter, etc.)
│   ├── bitcoin-wallet.ts      # Bitcoin wallet service
│   ├── wallet.ts              # EVM wallet service
│   ├── bus.ts                 # Event bus
│   ├── db-init.ts             # Database initialization
│   ├── mission-control.ts     # Mission control orchestration
│   ├── negotiation.ts         # Agent negotiation protocol
│   ├── platform-jobs.ts       # Background job processing
│   └── stream-ai.ts           # Streaming AI responses
├── lib/
│   ├── agents/                # Agent definitions (coder, researcher, writer)
│   ├── orchestration/         # Concurrent tool execution
│   ├── permissions/           # Tiered permission system
│   ├── security/              # Command/prompt security
│   ├── hooks/                 # Agent lifecycle hooks
│   ├── container-manager.ts   # Docker container management
│   ├── config-generator.ts    # OpenClaw config generation
│   ├── pipeline.ts            # Processing pipeline
│   └── team-provisioning.ts   # Team setup
└── middleware/
    ├── auth.ts                # Authentication middleware
    ├── permission-hook.ts     # Permission enforcement
    └── plan.ts                # Plan/billing middleware
```

## Gateway (gateway/) — OpenClaw Gateway Service
```
gateway/
├── src/
│   ├── config/                # Gateway configuration
│   ├── middleware/            # Auth, rate limiting
│   ├── routes/                # API routes
│   ├── services/              # LLM routing, tool invocation
│   └── utils/                 # Shared utilities
└── public/                    # Static assets
```

## x402 Payment Gateway (x402-tempo/) — Rust
```
x402-tempo/x402-gateway/crates/
├── tempo-x402/                # Core x402 library
├── tempo-x402-app/            # Application layer
├── tempo-x402-gateway/        # HTTP gateway
├── tempo-x402-identity/       # Identity/auth
├── tempo-x402-model/          # Data models
├── tempo-x402-node/           # Tempo node client
├── tempo-x402-security-audit/ # Security auditing
└── tempo-x402-soul/           # Agent soul/personality
```

## Key Features by Page
- **Dashboard** → 40+ pages (agents, wallet, streaming, colony, tasks, etc.)
- **API** → 80+ route groups (auth, billing, AI, blockchain, webhooks)
- **Skills** → 12 specialized skills (venue-finder, royalty-tracker, etc.)
- **Blog** → 60+ technical blog posts
- **Use Cases** → 6 verticals (creative agency, creator studio, crypto, ecommerce, music, solo founder)

## Tech Stack
- **Frontend:** Next.js 14, React 19, Tailwind CSS, shadcn/ui, wagmi, viem, OnchainKit
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL (Neon)
- **AI:** OpenRouter (multi-model), OpenClaw agent runtime
- **Blockchain:** Base (EVM), Solana, Tempo (x402 payments)
- **Infra:** Vercel (frontend), Railway (backend + gateway), Docker (agents)
- **Auth:** NextAuth (Google, Farcaster, wallet), WebAuthn/passkeys
- **Payments:** Stripe, x402 (on-chain), BTCPay (Bitcoin)
- **Streaming:** Mux (video), token-gated ($RAVE)
- **AI Models:** MiMo-Pro, blockrun/free, qwen3.6-plus, 34+ via smart routing
