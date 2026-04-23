# New Features & Codebase Changes — April 2026

Last updated: 2026-04-09  
Source: Git history (last 30 commits), codebase scan

---

## 1. Blockchain Buddies (Tamagotchi-style Agent Pets)
**Commit:** `68bc13c0`, `9608b46d`  
**Files:** `web/app/buddies/`, `web/app/api/buddies/`, `web/prisma/schema.prisma`

- Virtual pets tied to user accounts — hatch, feed, play, level up
- 5 buddy types: Agentbot Baby (common) → Spark Agent → Ghost Agent → Dragon Agent → Alien Agent (legendary)
- XP/energy/happiness system with animations (spin, bounce, float, pulse, wiggle)
- **Prisma model:** `Buddy` with userId, type, level, xp, energy, happiness, lastFed, lastPlayed
- **API routes:** `GET/POST /api/buddies`, `GET/PATCH/DELETE /api/buddies/[buddyId]`
- Authenticated users get DB persistence; unauthenticated falls back to localStorage
- Unicode emoji animations for each buddy type

## 2. Solana Integration
**Commit:** `6b04ce49`  
**Files:** `web/app/dashboard/solana/`, `web/app/solana/`, sidebar + footer links

- New Solana dashboard: wallet connect, Jupiter token swaps, SPL token deploy, Metaplex NFT mint
- Solana Agent Kit model integration via MCP tools
- Public landing page at `/solana`
- Wallet lookup with balance display

## 3. Expert Setup Booking (Stripe Checkout)
**Commit:** `2f88fb39`  
**Files:** `web/app/expert-setup/`, `web/app/api/stripe/expert-setup-checkout/`, `web/app/capabilities/`

- Paid 1-on-1 setup sessions — calendar slot picker (Mon-Fri, 3 time slots)
- Stripe checkout integration for payment
- Features: screen share, custom config, integration guidance, model selection, workflow optimization
- Success page with confirmation
- Capabilities page at `/capabilities` — showcases all 15 platform features with icons

## 4. Playground — AI App Generation
**Commit:** `53707f05`  
**Files:** `web/app/playground/`, `docs/PLAYGROUND_STRATEGY.md`

- Text-to-app generator — describe what you want, get HTML/JS code
- Preview in iframe, copy code, download as HTML
- Currently uses template-based generation (placeholder for real AI API)
- Strategy doc covers roadmap for AI-powered generation

## 5. Bitcoin Dashboard — Public Node + Blockstream Jade + Liquid
**Commit:** `949b1560`, earlier commits  
**Files:** `web/app/dashboard/bitcoin/`, `web/app/api/bitcoin/`

- Bitcoin dashboard with public-node/read-only explorer support
- Blockstream Jade hardware wallet support (USB + QR)
- Liquid Network (L-BTC) integration via LWK (Lightning Wallet Kit)
- Public-node mode for read-only chain visibility and wallet exploration

## 6. Git City — 3D GitHub Visualization
**Files:** `web/app/dashboard/git-city/`

- 3D city built from GitHub commit history (Three.js / React Three Fiber)
- Buildings represent days, height = commit count, color by activity
- Interactive — click buildings for commit details
- Orbit controls for camera navigation

## 7. Jobs Board
**Files:** `web/app/jobs/`, `web/app/api/jobs/`

- Job listing board with filtering by role type, seniority, contract type, tech stack
- External job aggregation + internal postings
- Company profiles with logos
- Career page, sponsor page, company-specific views
- Apply flow with job detail pages

## 8. Video Generation
**Commit:** earlier  
**Files:** `web/app/api/generate-video/`, `web/app/lib/video/`

- 4 video types: demo, marketing, screenshot animation, tutorial
- Uploads to Vercel Blob storage
- 5-minute max duration (300s timeout)
- Authenticated, paid API

## 9. Music Generation (Placeholder)
**Files:** `web/app/api/generate-music/`, `web/app/generate-music/`

- API route exists but returns "coming soon"
- Planned integrations: Google Lyria, MiniMax, ComfyUI workflows
- UI page exists for the feature

## 10. Turborepo Monorepo Setup
**Commit:** `3f367bd0`  
**Files:** `turbo.json`

- Turborepo 2.9 added for monorepo build orchestration
- Tasks: build (with ^build dependency), lint, test, dev (no cache), deploy (depends on build)
- Outputs: `dist/**`, `.next/**`
- Global deps: `**/.env.*local`

## 11. Passkey Authentication
**Files:** `web/app/api/passkey/`

- WebAuthn passkey registration and auth
- Register: options + verify endpoints
- Auth: options + verify endpoints
- Passwordless login flow

## 12. Showcase & Agent Discovery
**Files:** `web/app/showcase/`, `web/app/api/showcase/`, `web/app/api/agents/showcase/`

- Public agent showcase for discovery
- Agent cards with capabilities, pricing, status

## 13. Referral System
**Files:** `web/app/api/referral/`, `web/app/api/referrals/`

- Referral code generation and application
- Track referral stats

## 14. Rebrand — Competitor References Removed
**Commit:** `8ec3440a`

- All competitor branding replaced with Agentbot
- Consistent branding across the platform

## 15. Blog Posts
**Commits:** `2ce57b08`, `eada500d`, `9c3e3bb7`

- "Showcase Trials Live" blog post
- April 8 update post
- "Cybersecurity in the Age of AI" post

---

## Dashboard Pages Inventory (78 pages)

### Public Pages (25)
`/` `/agents` `/basefm` `/billing` `/blog` `/buddies` `/capabilities` `/demo` `/documentation` `/expert-setup` `/generate-music` `/generate-video` `/jobs` `/learn` `/login` `/marketplace` `/music-wizard` `/news` `/onboard` `/playground` `/pricing` `/showcase` `/signup` `/solana` `/token`

### Dashboard Pages (53)
Standard: `/dashboard` `/dashboard/admin` `/dashboard/analytics` `/dashboard/borg` `/dashboard/calendar` `/dashboard/colony` `/dashboard/config` `/dashboard/cost` `/dashboard/devices` `/dashboard/files` `/dashboard/finance` `/dashboard/fleet` `/dashboard/heartbeat` `/dashboard/keys` `/dashboard/memory` `/dashboard/personality` `/dashboard/skills` `/dashboard/stats` `/dashboard/streaming` `/dashboard/support` `/dashboard/swarms` `/dashboard/tasks` `/dashboard/team` `/dashboard/trading` `/dashboard/verify` `/dashboard/wallet` `/dashboard/workflows` `/dashboard/x402`

New: `/dashboard/bitcoin` `/dashboard/bookings` `/dashboard/daily-brief` `/dashboard/debug` `/dashboard/dj-stream` `/dashboard/git-city` `/dashboard/gitlawb-network` `/dashboard/maintenance` `/dashboard/market-intel` `/dashboard/signals` `/dashboard/solana` `/dashboard/system-pulse` `/dashboard/tech-updates` `/dashboard/tour` `/dashboard/venue-finder`

### Use Case Pages (7)
`/use-cases` `/use-cases/creative-agency` `/use-cases/creator-studio` `/use-cases/crypto-community` `/use-cases/ecommerce` `/use-cases/music-audio` `/use-cases/solo-founder`

---

## API Routes Inventory (130+ endpoints)

Key new route groups:
- `/api/buddies/*` — Blockchain Buddies CRUD
- `/api/jobs/*` — Jobs board (board, apply, career, companies, sponsors, external)
- `/api/passkey/*` — WebAuthn passkey auth
- `/api/skills/*` — 12 music-industry skills (booking, venue-finder, royalty-tracker, etc.)
- `/api/referral/*` — Referral system
- `/api/mission-control/fleet/*` — Fleet graph, costs, bookings, traces
- `/api/generate-video/*` — Video generation
- `/api/generate-music/*` — Music generation (placeholder)
- `/api/stripe/expert-setup-checkout/` — Expert setup payment
- `/api/orchestration/batch/` — Batch orchestration
- `/api/agents/showcase/` — Public agent showcase
- `/api/webhooks/*` — Stripe, Discord, WhatsApp, Mux, Railway, Resend
- `/api/workflows/*` — Workflow CRUD + signup

## 16. Factory AI Transformation (Fact-Based Backend)
**Commit:** `cb4c552f`, `04ffb626`, `6e507473`
**Files:** `web/app/api/admin/`, `agentbot-backend/src/middleware/signature.ts`, `web/app/lib/redis.ts`

- **Identity is a Fact:** Shifted from legacy Bearer tokens to DID-native cryptographic signatures.
- **SignatureGuard:** Backend enforcement of Ethereum-compatible message signatures (`x-agent-signature`).
- **signedFetch:** Frontend utility for automated, cryptographically signed requests.
- **Durable Workflows:** Orchestration moved to Vercel Workflow for resilient, replayable execution logs.
- **State Mirroring:** JSON configuration state is now mirrored to Gitlawb (immutable warm storage).
- **Railway-Only:** Removed all Render references; unified platform on Railway infrastructure.

## 17. Factory Master Model: MiMo V2 Pro
**Commit:** `cb4c552f`
**Files:** `agentbot-backend/src/services/ai-provider.ts`

- **Xiaomi MiMo V2 Pro:** Integrated as the "Factory Master" model for autonomous reasoning.
- **Vercel AI Gateway:** Unified model routing with centralized rate limiting and security (`vck_` key active).
- **Default Onboarding:** New agents automatically provision with MiMo V2 Pro for maximum logic performance.

## 18. Bitcoin & Greenlight Sovereignty
**Commit:** `9df9433f`, `33da78e7`, `57b3ede1`, `1456cea7`
**Files:** `web/app/dashboard/bitcoin/`, `web/app/api/bitcoin/greenlight/`

- **Zpub/Descriptor Support:** Bitcoin dashboard now enables registration of Zpubs and advanced output descriptors.
- **Greenlight Credentials:** Secure storage for `device.crt` and `device-key.pem` files (PEM format).
- **Mainnet Shift:** All Bitcoin/Liquid status tracking moved to mainnet (`liquidv1`, `bitcoin` network).
- **Resilient Registration:** Local DB persistence for wallets even if private NBXplorer is unreachable (Public Mode).

## 19. Agentbot Coach & Education Hub
**Commit:** `04ffb626`
**Files:** `web/app/dashboard/coach/`, `web/app/components/DashboardSidebar.tsx`

- **Interactive Coaching:** New training dashboard at `/dashboard/coach` for new operators.
- **Education Section:** Sidebar now features a dedicated section for Coach, Learn, and Guide resources.
- **Onboarding Success:** Transition from agent deployment directly into operator training modules.

## 20. Ops Command Center — Live Data
**Commit:** `6e507473`, `04ffb626`
**Files:** `web/app/admin/`, `web/app/api/admin/db-health/`

- **Real-Time Metrics:** Fleet and user base counts pulled live from Prisma.
- **Force Global Sync:** One-click tool to reconcile singular (frontend) and plural (backend) database tables.
- **Platform Health:** Dynamic probes for Railway API and Gitlawb node status.

## 21. Global Visual Transition (Factory Orange)
**Commit:** `cb4c552f` and global refactor
**Files:** Entire `web/app` directory

- **Factory Orange Aesthetic:** All blue/cyan accents replaced with `#EF6F2E` (Tailwind `orange-500/400`).
- **High-Energy Spinner:** High-performance loading states across all dashboard views.
- **Daily Brief Sync:** Unified "Upcoming" section colors and activity logs.

---

## Tech Stack Additions (Updated)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Identity | did:key + ethers.js | Cryptographic request verification |
| AI | MiMo V2 Pro + Vercel AI Gateway | High-performance autonomous logic |
| Workflow | Vercel Workflow DevKit | Durable, resumable orchestration |
| Persistence | Gitlawb + Prisma | Dual-tier state (Mutable SQL + Immutable Git) |
| Caching | Upstash Redis (Unified) | Resilient performance and rate limiting |
