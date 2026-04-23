# Tasks

## In Progress
- [ ] Vercel redeploy to seed 6 new skills into DB and publish blog post (Triggered by push)

## Up Next
- [ ] Update Talent Protocol stats (1,713 commits, 85 PRs) — requires wallet login

## Done
- [x] Security audit — all CRIT/HIGH/MED/LOW findings fixed
- [x] CRIT-01: Outer Bearer auth gate (timingSafeEqual, fail-closed)
- [x] HIGH-01: Invite codes — atomic DB consumption, requireInternalAuth
- [x] HIGH-04: API keys — SHA-256 hash lookup, never store raw keys
- [x] MED-04: Container updates preserve plan-specific resource limits
- [x] MED-06: exec() → spawn() everywhere (no shell injection)
- [x] LOW-03: Per-user monthly token quota in model_metrics table
- [x] LOW-04: Extended SSRF blocklist (IPv6 ULA, mapped IPv4, CGN, zone IDs)
- [x] Discord interactions: SHA256 → Ed25519 (SubtleCrypto)
- [x] WhatsApp webhook: fail-closed + timingSafeEqual length guard
- [x] Mux webhook: timingSafeEqual length guard + replay protection
- [x] Stripe webhook: fail-closed (503 if secret not configured)
- [x] provision route (web): NextAuth gate + subscription check + INTERNAL_API_KEY
- [x] container-manager.ts: hardcoded path removed, exec → spawn, curl → fetch
- [x] bus.ts: IPv6 bracket stripping fix (Node.js 18+ URL.hostname behavior)
- [x] End-to-end security tests: 107/107 passing
- [x] Fact-Based Architecture: Identity (DID-signatures), Execution (Workflows), State (Gitlawb)
- [x] Railway-only migration: Removed Render references, updated GQL provisioning
- [x] SignatureGuard verification: 4/4 passing in dedicated test suite
- [x] Prune stale branches (18 deleted) and clear git stashes (All cleared)
- [x] Register blog post in `web/app/blog/blogPosts.ts` (security-patch-apr-9-2026)
- [x] Project-wide domain migration: raveculture.xyz -> agentbot.sh
- [x] Robust skill seeding: switched to upsert logic in ensureSkillsSeeded
- [x] Fixed duplicate MiMo case study slug in blogPosts.ts
- [x] Dashboard Speed Optimization: consolidated multiple sequential API calls into single /api/dashboard/data endpoint
- [x] Implemented edge caching for dashboard data with stale-while-revalidate
- [x] Refactored DashboardDataProvider and DashboardSidebar for centralized data model
- [x] Enabled Next.js Partial Prerendering (PPR) for instant shell delivery
- [x] Implemented dynamic imports for heavy dashboard components (InstanceControlPanel, ConfirmDialog)
- [x] Optimized HeroImage using next/image with high-priority loading
- [x] Added high-impact database indexes to Post, Comment, SocialVote, and Activity models
- [x] Optimized package imports (lucide, framer-motion, sonner) in next.config.js
- [x] Implemented Redis caching for OpenClaw runtime probes (15s TTL) to reduce network overhead
- [x] Enabled intelligent Link prefetching in DashboardSidebar for instant navigation
- [x] Implemented Optimistic UI for social interactions:
    - FollowButton: Instant state toggle and counter update
    - JoinButton: Instant community membership toggle
    - PostCard: Added interactive optimistic voting system
- [x] Migrated Social API routes to Next.js 16 Server Actions:
    - Centralized logic in `web/app/actions/social.ts`
    - Reduced API boilerplate and handled path revalidation natively
    - Implemented `toggleFollowAgent`, `toggleJoinCommunity` (ID/Slug support), and `votePost`
- [x] Mobile UI refinements:
    - Fixed horizontal overflow in dashboard and control panels
    - Optimized `InstanceControlPanel` grid and text-breaking for small screens
    - Enhanced `PostCard` responsiveness and touch targets
    - Added mobile-first padding and overflow management to core layouts
- [x] Proactive Self-Healing & Vercel Monitoring:
    - Accelerated cleanup cron to 15-minute intervals
    - Added automated repair for stuck M2M jobs and disconnected agents
    - Implemented active Mux API reconciliation for DJ sessions to eliminate ghost streams on `agentbot.sh` and `basefm.space`
    - Integrated `@vercel/otel` OpenTelemetry tracing in `instrumentation.ts`
    - Created `logGlobalError` Server Action to automatically pipe React boundary crashes to support webhook
- [x] Next.js 16 & React 19 Build Fixes:
    - Repaired mangled JSX layout and missing imports in `app/admin/page.tsx`
    - Removed incompatible segment-level `dynamic` and `revalidate` exports project-wide
    - Verified `cacheComponents` configuration in `next.config.js`
