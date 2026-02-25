# Agentbot Backend Review & Options Analysis

**Date:** 2026-02-25  
**Reviewer:** Architect Mode  
**Status:** Strategic Planning Complete

---

## Executive Summary

After reviewing all documentation and code, the backend needs significant work to support the 90-day roadmap. The current architecture has **two separate backend APIs** doing similar things, **no database integration** in the backend, and **incomplete blockchain integration**. The strategic documents correctly identify that the focus should be on the **Royalty Split Agent** as the killer feature.

**Recommendation:** Consolidate backends, add PostgreSQL, and focus on shipping the Royalty Split Agent MVP in 4 weeks.

---

## Current Architecture Analysis

### What Exists Today

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                        │
│                    Deployed: Vercel                              │
│                    - NextAuth for auth                           │
│                    - Prisma ORM                                  │
│                    - Stripe payments                             │
│                    - CDP SDK installed but not integrated        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│  agentbot-backend/  │           │      api/           │
│  (Express + TS)     │           │  (Express + JS)     │
│  Port: 3001         │           │  Port: 3000         │
│                     │           │                     │
│  - Docker mgmt      │           │  - Docker mgmt      │
│  - File-based store │           │  - Caddy config     │
│  - No database      │           │  - File-based store │
│  - No Redis         │           │                     │
└─────────────────────┘           └─────────────────────┘
         │                                   │
         └─────────────────┬─────────────────┘
                           ▼
              ┌─────────────────────┐
              │  GCP VM (Docker)    │
              │  - OpenClaw         │
              │  - Containers       │
              │  - File storage     │
              └─────────────────────┘
```

### Code Quality Assessment

| Component | Quality | Issues |
|-----------|---------|--------|
| [`agentbot-backend/src/index.ts`](agentbot-backend/src/index.ts) | Good | No DB, file-based storage, TODOs incomplete |
| [`api/server.js`](api/server.js) | Fair | Duplicate functionality, JS not TS |
| [`web/app/api/`](web/app/api/) | Good | Next.js API routes working |
| Database Schema | Missing | Only Prisma client, no royalty split tables |
| Smart Contracts | Missing | Designed but not implemented |

### Critical Gaps

1. **Two Backend APIs** - [`agentbot-backend/`](agentbot-backend/) and [`api/`](api/) do similar things
2. **No Database in Backend** - Using JSON files for agent metadata
3. **Redis Not Implemented** - Mentioned in docs but not used
4. **CDP SDK Not Integrated** - Packages installed but wallet API returns 501
5. **No Smart Contracts** - RoyaltySplit.sol designed but not deployed
6. **No Real Users** - 0 beta collectives onboarded

---

## Backend Options

### Option 1: Consolidate & Modernize ⭐ RECOMMENDED

**Description:** Merge the two backends into one modern TypeScript API with PostgreSQL.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                        │
│                    Vercel                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Unified Backend (Express + TypeScript)             │
│              GCP VM or Railway                                  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Agent Mgmt  │  │   Splits    │  │  Payments   │             │
│  │  (Docker)   │  │  (Smart     │  │  (Stripe +  │             │
│  │             │  │  Contracts) │  │   USDC)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ PostgreSQL  │  │   Redis     │                               │
│  │  (Prisma)   │  │   (Queue)   │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │  OpenClaw           │
              │  Containers         │
              └─────────────────────┘
```

**Pros:**
- Clean, maintainable architecture
- Single source of truth
- Proper database for splits, payments, users
- TypeScript throughout
- Aligns with 90-day roadmap

**Cons:**
- Requires migration work
- Need to set up PostgreSQL properly
- More upfront work

**Effort:** 2-3 weeks to consolidate and add database

---

### Option 2: Serverless-First with Vercel

**Description:** Move all API logic to Next.js API routes, use Vercel for everything.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js App (Vercel)                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Pages     │  │  API Routes │  │  Server     │             │
│  │   (UI)      │  │  (Logic)    │  │  Actions    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │  Supabase   │  │   Vercel    │                               │
│  │  (Postgres) │  │    Blob     │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │  GCP VM (Docker)    │
              │  OpenClaw only      │
              └─────────────────────┘
```

**Pros:**
- Single deployment platform
- Vercel handles scaling
- Simpler ops
- Already using Vercel for frontend

**Cons:**
- Vercel serverless has timeout limits
- Docker management still needs VM
- Cold starts for API routes
- Less control over backend

**Effort:** 2 weeks to migrate API routes

---

### Option 3: Keep Current + Add Database

**Description:** Minimal changes - keep both backends, just add PostgreSQL.

**Architecture:**
```
Current architecture + PostgreSQL database
```

**Pros:**
- Least amount of change
- Fast to implement
- Can start on royalty split immediately

**Cons:**
- Technical debt remains
- Two backends still confusing
- Inconsistent codebase
- Harder to maintain long-term

**Effort:** 1 week to add database

---

### Option 4: Focus on Royalty Split MVP Only

**Description:** Ignore backend consolidation, focus entirely on shipping royalty split agent.

**Architecture:**
```
Add royalty split tables to existing Prisma schema
Deploy RoyaltySplit.sol to Base
Build minimal UI for splits
Ship in 2 weeks
```

**Pros:**
- Fastest path to value
- Aligns with audit recommendations
- Gets product in users' hands
- Validates value proposition

**Cons:**
- Technical debt accumulates
- May need rework later
- Backend still messy

**Effort:** 2 weeks to MVP

---

## Recommendation: Hybrid Approach

Based on the strategic documents and audit findings, I recommend a **hybrid approach**:

### Phase 1: Royalty Split MVP (Weeks 1-2)
1. Add royalty split tables to Prisma schema
2. Deploy RoyaltySplit.sol to Base Sepolia
3. Build minimal UI for creating/executing splits
4. Get 5 beta collectives using it

### Phase 2: Backend Consolidation (Weeks 3-4)
1. Merge agentbot-backend and api/ into one
2. Add PostgreSQL with Prisma
3. Implement Redis for job queues
4. Clean up Docker management

### Phase 3: Scale (Weeks 5-12)
1. Add Talent Booking Agent
2. Implement Agent-to-Agent Protocol
3. Build network effects

---

## Technical Implementation Plan

### Week 1-2: Royalty Split MVP

#### Database Schema
```prisma
model Split {
  id          String   @id @default(cuid())
  splitId     String   @unique  // onchain ID
  userId      String
  name        String
  description String?
  recipients  Json     // [{address, percentage, name}]
  totalReceived      Decimal @default(0) @db.Decimal(20, 6)
  totalDistributed   Decimal @default(0) @db.Decimal(20, 6)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  payments    SplitPayment[]
  milestones  SplitMilestone[]
}

model SplitPayment {
  id          String   @id @default(cuid())
  splitId     String
  split       Split    @relation(fields: [splitId], references: [splitId])
  amount      Decimal  @db.Decimal(20, 6)
  senderAddress String
  txHash      String   @unique
  platformFee Decimal  @db.Decimal(20, 6)
  status      String   @default("pending")
  createdAt   DateTime @default(now())
  
  distributions SplitDistribution[]
}

model SplitDistribution {
  id          String   @id @default(cuid())
  paymentId   String
  payment     SplitPayment @relation(fields: [paymentId], references: [id])
  recipientAddress String
  amount      Decimal  @db.Decimal(20, 6)
  txHash      String?
  status      String   @default("pending")
  createdAt   DateTime @default(now())
}

model SplitMilestone {
  id          String   @id @default(cuid())
  splitId     String
  split       Split    @relation(fields: [splitId], references: [splitId])
  amount      Decimal  @db.Decimal(20, 6)
  description String
  released    Boolean  @default(false)
  releasedAt  DateTime?
  createdAt   DateTime @default(now())
}
```

#### Smart Contract Tasks
1. Complete RoyaltySplit.sol (already designed)
2. Add unit tests with Hardhat
3. Deploy to Base Sepolia testnet
4. Verify on BaseScan
5. Deploy to Base mainnet

#### API Endpoints Needed
```
POST   /api/splits              - Create split
GET    /api/splits/:id          - Get split details
POST   /api/splits/:id/pay      - Execute payment
GET    /api/splits/:id/history  - Payment history
POST   /api/splits/:id/milestone - Add milestone
```

#### Frontend Components
1. Split creation form
2. Recipient management
3. Payment history view
4. Wallet connection (OnchainKit)

---

### Week 3-4: Backend Consolidation

#### Tasks
1. Create new unified backend structure
2. Migrate Docker management code
3. Add Prisma client
4. Implement Redis for queues
5. Add proper error handling
6. Write API documentation
7. Add tests

#### New Backend Structure
```
agentbot-backend/
├── src/
│   ├── index.ts           # Express app
│   ├── routes/
│   │   ├── agents.ts      # Agent CRUD
│   │   ├── splits.ts      # Royalty splits
│   │   ├── payments.ts    # Payment processing
│   │   └── auth.ts        # Authentication
│   ├── services/
│   │   ├── docker.ts      # Docker management
│   │   ├── blockchain.ts  # Smart contract interactions
│   │   └── notifications.ts # Telegram/email
│   ├── lib/
│   │   ├── prisma.ts      # Database client
│   │   └── redis.ts       # Redis client
│   └── types/
│       └── index.ts       # TypeScript types
├── prisma/
│   └── schema.prisma      # Database schema
├── package.json
└── tsconfig.json
```

---

## Success Metrics

### Week 2
- [ ] RoyaltySplit.sol deployed to Base Sepolia
- [ ] Database schema migrated
- [ ] API endpoints working
- [ ] 5 beta collectives identified

### Week 4
- [ ] Royalty Split MVP live on mainnet
- [ ] 5 beta users onboarded
- [ ] £1K+ USDC processed
- [ ] Backend consolidated

### Week 12
- [ ] 10 bookings completed
- [ ] £10K+ USDC processed
- [ ] Agent-to-agent protocol live
- [ ] 20+ active users

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Smart contract bugs | Extensive testing, audit, start with small amounts |
| Low beta adoption | Over-recruit, offer incentives, personal outreach |
| Backend migration issues | Keep old API running, gradual migration |
| CDP SDK integration | Use existing patterns, Coinbase support |

---

## Next Steps

1. **User Decision:** Which backend option to pursue?
2. **Immediate Action:** Start on royalty split database schema
3. **Week 1 Focus:** Smart contract development + beta recruitment

---

## Questions for User

1. Do you want to consolidate backends now or focus on royalty split MVP first?
2. What's your preferred database? (PostgreSQL/Supabase/Neon)
3. Do you have CDP API keys ready for wallet integration?
4. Which 5 beta collectives should we target first?
