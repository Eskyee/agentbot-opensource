# Agentbot Repository Audit & Improvement Plan

**Audit date:** 2026-06-10  
**Auditor:** Atlas_baseFM (PAI Algorithm)  
**Repository:** agentbot (monorepo — web, agentbot-backend, gateway)

---

## Executive Summary

**Overall Health Grade: C+**

Agentbot is a ambitious, feature-rich AI agent platform with strong security awareness in its core paths but significant structural debt. The codebase has 392 API routes, 60+ database models, and integrates with 15+ external services — impressive for a project at this stage. However, a 1,105-line god file, dual provisioning systems, 3 critical timing side-channel vulnerabilities, and near-zero test coverage on core business logic services undermine reliability.

**Top 3 Risks:**
1. **3 Critical timing side-channel attacks** on auth endpoints allow brute-force enumeration of secrets
2. **Unauthenticated SSRF proxy** to internal Railway services via `/api/openclaw/proxy/`
3. **Core business logic (ai.ts, wallet.ts, bus.ts) has zero dedicated tests** — regressions ship silently

**Top 3 Opportunities:**
1. **Fix auth timing attacks** — 30-minute fix, eliminates critical vulnerabilities
2. **Extract index.ts into modules** — unblocks testability, reduces review friction
3. **Add integration tests for provisioning** — the most complex and fragile flow

---

## Repo Map

| Aspect | Detail |
|--------|--------|
| **Purpose** | Open-source AI agent platform — provisions & manages AI agent containers for music/culture industry users |
| **Stack** | Next.js 16 (App Router) + Express + TypeScript + Prisma + PostgreSQL (Neon) |
| **Monorepo** | Turborepo with 3 workspaces: `web`, `agentbot-backend`, `gateway` |
| **Maturity** | Production service (deployed on Vercel + Railway) with prototype-level structural debt |
| **Scale** | 392 API routes, 60+ DB models, 14 backend services, 15+ external integrations |

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `web/app/api/` | ~392 Next.js route handlers (frontend + API in one) |
| `agentbot-backend/src/services/` | 14 business logic modules (ai, wallet, bus, etc.) |
| `agentbot-backend/src/routes/` | 13 Express API routers |
| `agentbot-backend/src/middleware/` | 5 security/auth middleware modules |
| `agentbot-backend/src/lib/` | 21 shared library modules |
| `web/prisma/` | Database schema (1,638 lines, 60+ models) |
| `gateway/src/` | Railway wrapper for OpenClaw agent runtime |

### Surprising Findings

1. **Dual schema systems** — PascalCase models (App Router era) AND snake_case models (legacy) coexist in the same Prisma schema with `@map` directives
2. **3 separate plan/pricing definitions** — `index.ts`, `routes/provision.ts`, and `web/app/api/billing/route.ts` each define plans independently with different names (solo vs starter)
3. **Bridge client uses `execSync`** while the entire backend correctly uses `spawn` — the one place that wasn't audited

---

## Audit Report

### Architecture & Design

| # | Severity | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| A1 | **HIGH** | God file: `index.ts` is 1,105 lines containing route mounting, Docker orchestration, port management, file locking, auto-update logic, WebSocket proxying, health checks, and the global error handler | `agentbot-backend/src/index.ts` | Any change risks breaking unrelated functionality; untestable; blocks reviews |
| A2 | **HIGH** | Dual provisioning paths with different validation logic — `web/app/api/provision/route.ts` (302 lines) and `agentbot-backend/src/routes/provision.ts` (314 lines) independently validate plans, check subscriptions, and deploy agents | `web/app/api/provision/route.ts`, `agentbot-backend/src/routes/provision.ts` | Plan definitions drift; AGENTS.md warns "may succeed without creating a Prisma Agent row" |
| A3 | **HIGH** | 3 separate plan/pricing definitions — `index.ts:48-60` (solo/collective/label/network), `routes/provision.ts:26-31` (solo/collective/label/network), `web/app/api/billing/route.ts:10-31` (starter/probe/scale — different names) | `index.ts:48-60`, `provision.ts:26-31`, `billing/route.ts:10-31` | Billing page uses different plan names than backend; silent mapping failures |
| A4 | **MEDIUM** | Dual database schema systems — PascalCase models (App Router era) and snake_case models (legacy) coexist with `@map` directives; backend also creates tables via raw SQL in `db-init.ts` | `web/prisma/schema.prisma`, `agentbot-backend/src/services/db-init.ts` | Three independent schema sources; migration conflicts |
| A5 | **MEDIUM** | 392 API route handlers in `web/app/api/` — many are thin wrappers or one-off endpoints without clear ownership boundaries | `web/app/api/` | Discoverability is poor; similar functionality scattered across routes |

### Security

| # | Severity | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| S1 | **CRITICAL** | Timing side-channel in cron auth — uses `!==` instead of `timingSafeEqual` | `agentbot-backend/src/routes/cron.ts:18` | Attacker can enumerate CRON_SECRET character-by-character |
| S2 | **CRITICAL** | Timing side-channel in ops runs log auth — uses `===` to compare INTERNAL_API_KEY | `web/app/api/ops/runs/log/route.ts:17-18` | Full backend API key enumerable via timing attack |
| S3 | **CRITICAL** | Timing side-channel in ops metrics auth — uses `===` to compare INTERNAL_API_KEY and BRIDGE_SECRET | `web/app/api/ops/metrics/collect/route.ts:18-19` | Two high-value secrets vulnerable to timing enumeration |
| S4 | **HIGH** | Timing side-channel in hook classify auth — plain string comparison for Bearer token | `web/app/api/hooks/classify/route.ts:82` | Bypass tiered permission system; approve destructive commands |
| S5 | **HIGH** | Unauthenticated SSRF proxy to internal Railway services — `/api/openclaw/proxy/` explicitly bypasses auth | `agentbot-backend/src/index.ts:527-530` | Proxy HTTP requests to `agentbot-agent-{id}.railway.internal:18789` |
| S6 | **HIGH** | Command injection via `execSync` in bridge client — `JSON.stringify(prompt)` does NOT prevent shell injection | `web/public/bridge/client.js:96-98` | Arbitrary command execution via crafted prompt payload |
| S7 | **HIGH** | `dangerouslyDisableDeviceAuth: true` hardcoded in every provisioned agent | `agentbot-backend/src/routes/railway-provision.ts:135` | Combined with S5, enables full agent takeover |
| S8 | **HIGH** | `GET /api/provision` exposes user emails/plans with optional auth — if `BRIDGE_SECRET` env is unset, endpoint is completely unauthenticated | `web/app/api/provision/route.ts:274-301` | Information disclosure; anonymous callers enumerate user data |
| S9 | **MEDIUM** | Bridge secret compared with `!==` instead of `timingSafeEqual` | `web/app/api/provision/route.ts:279` | Timing attack on bridge secret |
| S10 | **MEDIUM** | `CryptoJS.AES` for wallet encryption — uses MD5-based key derivation, not recommended for new applications | `agentbot-backend/src/services/wallet.ts:1,57` | Weaker encryption for security-critical wallet data |
| S11 | **MEDIUM** | Missing input validation on agent definition upload — no size limit, no content sanitization | `agentbot-backend/src/routes/agents.ts:450-472` | Disk exhaustion via large file writes to `/tmp` |
| S12 | **MEDIUM** | Missing rate limiting on invite validate endpoint (public, no auth) | `agentbot-backend/src/invite.ts:40` | Database load; timing-based code enumeration |
| S13 | **LOW** | File-based port lock unsuitable for distributed deployment | `agentbot-backend/src/index.ts:390-424` | Concurrent deployments could assign duplicate ports on Railway |

### Code Quality

| # | Severity | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| C1 | **HIGH** | 32 `as any` type assertions — worst offender `underground.ts` has 13 casts like `(req as any).userId` | `underground.ts:30,31,129,144,176,198,237,247,260,283,301,319,342` | Defeats TypeScript type safety; runtime errors where compile-time checks should catch |
| C2 | **MEDIUM** | 108 `console.error/warn/log` calls bypassing structured logger (`log` from `./lib/logger`) | Scattered across `underground.ts` (14), `scheduler.ts` (10), `registration.ts` (5), `index.ts` (5+) | Unstructured logs break production debugging; inconsistent observability |
| C3 | **MEDIUM** | Hardcoded mock data in production endpoint — `GET /api/deployments` returns fake timestamps | `web/app/api/deployments/route.ts:13-50` | Any client gets fake data; data integrity bug |
| C4 | **MEDIUM** | Hardcoded usage data — `billing/route.ts` returns `{ dailyUnits: 600, used: 245, remaining: 355 }` regardless of user | `web/app/api/billing/route.ts:94-100,168-172` | Users see identical usage data regardless of actual consumption |
| C5 | **MEDIUM** | Swallowed exceptions — bare `catch {}` blocks with no logging | `agentbot-backend/src/lib/port-manager.ts:25,40,69`, `index.ts:252,347,504,668` | Silent failures make production debugging impossible |
| C6 | **MEDIUM** | `require()` in TypeScript production code — bypasses type checking | `agentbot-backend/src/index.ts:970,1000` | Loses type safety and tree-shaking |
| C7 | **MEDIUM** | `require('stripe')` inside route handler — creates new Stripe client per request | `web/app/api/billing/route.ts:54` | Performance waste; no type checking on Stripe API calls |
| C8 | **LOW** | Unbounded in-memory Maps without TTL in bridge polling | `web/app/api/chat/route.ts:36-59` | Maps reset on Vercel cold starts; bridge unreliable in production |

### Testing

| # | Severity | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| T1 | **HIGH** | Core business logic services have zero dedicated tests — `ai.ts`, `wallet.ts`, `bus.ts`, `stream-ai.ts`, `metrics-core.ts` | `agentbot-backend/src/services/` | Regressions in AI routing, wallet encryption, and message bus ship silently |
| T2 | **HIGH** | God file `index.ts` excluded from test coverage (`collectCoverageFrom: ['src/**/*.ts', '!src/index.ts']`) | `agentbot-backend/jest.config.ts:7` | 1,105 lines of orchestration logic completely untested |
| T3 | **MEDIUM** | `smoke-test-review.test.ts` skipped in CI due to ESM dependency issue | `agentbot-backend/jest.config.ts:14` | Security audit test never runs in CI |
| T4 | **MEDIUM** | Backend `api.test.ts` tests a mock Express app, not the real routes | `agentbot-backend/src/api.test.ts` | Tests pass but don't validate actual API behavior |
| T5 | **LOW** | No component tests for React UI — only E2E via Playwright | `web/` | UI regressions only caught at E2E level |

### Performance

| # | Severity | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| P1 | **MEDIUM** | 108 unstructured `console.log` calls in hot paths (scheduler tick, metrics collection, auto-updater) | `scheduler.ts`, `metrics-core.ts`, `index.ts` | Synchronous I/O in async loops; logging overhead on every tick |
| P2 | **LOW** | Large Prisma schema (1,638 lines, 60+ models) — may slow `prisma generate` and increase bundle size | `web/prisma/schema.prisma` | Build time; cold start impact |
| P3 | **LOW** | In-memory Maps for bridge polling without size limits | `web/app/api/chat/route.ts:36-59` | Memory growth under load |

### Dependencies

| # | Severity | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| D1 | **MEDIUM** | CryptoJS for wallet encryption — pure-JS, MD5-based key derivation, not recommended | `agentbot-backend/src/services/wallet.ts:1` | Security-critical path using weak crypto library |
| D2 | **LOW** | Large `overrides` section in `package.json` (25+ entries) suggests version conflicts | `package.json:42-83` | Maintenance burden; potential compatibility issues |

### DevEx & Operations

| # | Severity | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| X1 | **MEDIUM** | Pre-commit hooks configured but unclear if enforced in CI | `.pre-commit-config.yaml` | Contributors may bypass local hooks |
| X2 | **LOW** | Multiple stale `.claude.json.tmp.*` files in home directory | `/Users/raveculture/.claude.json.tmp.*` | Disk clutter; confusing for new contributors |

### Documentation

| # | Severity | Finding | Location | Impact |
|---|--------|---------|----------|--------|
| DOC1 | **MEDIUM** | README.md references plan names (solo/collective/label/network) that differ from billing page (starter/probe/scale) | `README.md` vs `web/app/api/billing/route.ts` | Confusing for users and developers |
| DOC2 | **LOW** | Multiple overlapping markdown files (TASKS.md, SESSION_NOTES.md, CODE_REVIEW.md, BRIDGE_INSTRUCTIONS.md) without clear lifecycle | Root directory | Stale docs accumulate; unclear which are current |

---

## Strengths

1. **Core auth middleware is excellent** — `authenticate.ts` correctly uses `timingSafeEqual` with length check, fail-closed pattern
2. **Cryptographic signature verification** — Agent-to-agent bus uses proper signature verification with replay protection and nonce deduplication
3. **Shell injection prevention** — Backend consistently uses `spawn` with `shell: false` and `SecureExec` wrapper
4. **Financial transaction outbox** — `wallet.ts:transferUSDC` implements proper outbox pattern with idempotency keys and orphan detection
5. **Rate limiting** — Three tiered rate limiters (general, deploy, AI chat) with appropriate limits
6. **Structured request logging** — Request ID injection middleware enables end-to-end tracing
7. **Graceful shutdown** — Proper SIGTERM handling with connection draining and force-exit timeout
8. **CORS hardening** — Null-origin protection in production, configurable allowlist
9. **Security header stripping** — Middleware strips IIS bypass headers
10. **Docker image validation** — Regex validation prevents arbitrary image names

---

## Improvement Strategy

### Theme 1: Security Hardening (Eliminate Critical Vulnerabilities)

**Target state:** Zero timing side-channel vulnerabilities; all auth paths use `timingSafeEqual`.

**Principle:** Security patterns established in the core (`authenticate.ts`) must be consistently applied to ALL auth paths — cron, ops, hooks, and bridge.

**Trade-off:** Low effort, high payoff. The fix is mechanical (replace `===` with `timingSafeEqual`). No design decisions needed.

**Done when:** All auth comparisons use `timingSafeEqual`; SSRF proxy requires authentication.

### Theme 2: Structural Decomposition (Break the God File)

**Target state:** `index.ts` split into focused modules — routing, orchestration, health, auto-update.

**Principle:** Single Responsibility — each module does one thing well and is independently testable.

**Trade-off:** Medium effort, high payoff. The 1,105-line file blocks testability and review. But splitting requires careful dependency management.

**Done when:** `index.ts` is <200 lines; each extracted module has dedicated tests.

### Theme 3: Provisioning Consolidation (One Source of Truth)

**Target state:** Single provisioning path with unified plan definitions.

**Principle:** DRY — plan names, limits, and validation rules defined once and shared.

**Trade-off:** Medium effort, high payoff. Eliminates drift between web and backend provisioning.

**Done when:** One `plans.ts` file defines all plan metadata; both provisioning paths use it.

### Theme 4: Test Coverage (Core Business Logic)

**Target state:** Core services (ai, wallet, bus) have integration tests; provisioning has end-to-end tests.

**Principle:** Test the things that can lose money or break trust — wallet operations, AI routing, agent deployment.

**Trade-off:** High effort, high payoff. Tests for wallet encryption and AI routing are critical for confidence.

**Done when:** Core services have ≥80% line coverage; CI runs all tests including smoke-test-review.

### Theme 5: Observability Consistency (Structured Logging)

**Target state:** All logging uses the structured logger; zero `console.error/warn/log` in production code.

**Principle:** Observability is only as good as its weakest link — unstructured logs bypass the pipeline.

**Trade-off:** Low effort, medium payoff. Mechanical replacement of `console.*` with `log.*`.

**Done when:** Grep for `console.error` in `agentbot-backend/src/` returns zero results.

---

## Task Plan

### Milestone 0: Safety Net

| # | Task | Files | Acceptance | Effort | Risk | Deps |
|---|------|-------|------------|--------|------|------|
| M0.1 | Add integration tests for auth middleware | `middleware/authenticate.ts`, new test file | Tests verify timingSafeEqual usage; CI passes | S | Low | None |
| M0.2 | Fix CI to run smoke-test-review | `jest.config.ts` | `smoke-test-review.test.ts` runs in CI | S | Low | None |
| M0.3 | Add test for provisioning flow | `routes/provision.ts`, new test file | Provisioning creates Agent row in DB | M | Medium | None |

### Milestone 1: Critical Fixes

| # | Task | Files | Acceptance | Effort | Risk | Deps |
|---|------|-------|------------|--------|------|------|
| M1.1 | Replace timing-vulnerable comparisons with timingSafeEqual | `cron.ts:18`, `ops/runs/log/route.ts:17`, `ops/metrics/collect/route.ts:18`, `hooks/classify/route.ts:82`, `provision/route.ts:279` | All auth comparisons use `timingSafeEqual`; no `===` on secrets | S | Low | M0.1 |
| M1.2 | Add auth to `/api/openclaw/proxy/` path | `index.ts:527-530` | Proxy requires Bearer token; unauthenticated requests return 401 | S | Medium | None |
| M1.3 | Fix bridge client command injection | `web/public/bridge/client.js:96-98` | Use `spawn` with array args instead of `execSync` with string concatenation | S | Medium | None |
| M1.4 | Add auth to `GET /api/provision` | `web/app/api/provision/route.ts:274-301` | Endpoint requires authentication; returns 401 without valid token | S | Low | None |
| M1.5 | Add input validation to agent definition upload | `agentbot-backend/src/routes/agents.ts:450-472` | Content size limit (1MB); content type validation | S | Low | None |

### Milestone 2: High-Leverage Improvements

| # | Task | Files | Acceptance | Effort | Risk | Deps |
|---|------|-------|------------|--------|------|------|
| M2.1 | Extract `index.ts` into modules | `index.ts` → `router.ts`, `orchestration.ts`, `health.ts`, `auto-update.ts` | `index.ts` <200 lines; all routes still mount; tests pass | L | High | M0.1 |
| M2.2 | Create unified plans definition | New `plans.ts` + update `index.ts`, `provision.ts`, `billing/route.ts` | One `plans.ts` exports all plan metadata; both provisioning paths import from it | M | Medium | None |
| M2.3 | Add integration tests for wallet operations | `services/wallet.ts`, new test file | Tests verify encryption/decryption; transfer outbox pattern | M | Medium | None |
| M2.4 | Add integration tests for AI routing | `services/ai.ts`, new test file | Tests verify model selection, tier routing, error handling | M | Low | None |
| M2.5 | Add integration tests for agent bus | `services/bus.ts`, new test file | Tests verify signature verification, replay protection, nonce dedup | M | Low | None |
| M2.6 | Replace CryptoJS with Node crypto | `services/wallet.ts:1,57` | AES-256-GCM via `crypto` module; existing wallet data migrated | M | Medium | M2.3 |

### Milestone 3: Quality & Polish

| # | Task | Files | Acceptance | Effort | Risk | Deps |
|---|------|-------|------------|--------|------|------|
| M3.1 | Replace all `console.error/warn/log` with structured logger | 108 occurrences across `agentbot-backend/src/` | Grep returns zero `console.*` in production code | M | Low | None |
| M3.2 | Eliminate `as any` type assertions | 32 occurrences | Grep returns zero `as any` in `agentbot-backend/src/` | M | Low | None |
| M3.3 | Remove hardcoded mock data from production endpoints | `deployments/route.ts:13-50`, `billing/route.ts:94-100` | Endpoints return real data or are removed | S | Low | None |
| M3.4 | Add error handling to JSON.parse calls | `index.ts:259,429,476,799` | All `JSON.parse` wrapped in try/catch with logging | S | Low | None |
| M3.5 | Replace file-based port lock with Postgres advisory lock | `index.ts:390-424` | Lock works across multiple Railway instances | M | Medium | None |
| M3.6 | Update README plan names to match actual billing | `README.md` | Plan names consistent across all docs and code | S | Low | M2.2 |

---

### Quick Wins (High Impact, S Effort)

| # | Task | Impact |
|---|------|--------|
| Q1 | Fix timing side-channels (M1.1) | Eliminates 3 Critical vulnerabilities |
| Q2 | Add auth to proxy path (M1.2) | Eliminates unauthenticated SSRF |
| Q3 | Fix bridge client injection (M1.3) | Eliminates command injection |
| Q4 | Add auth to provision GET (M1.4) | Eliminates information disclosure |
| Q5 | Add input validation (M1.5) | Prevents disk exhaustion |

---

### Implementation Sketches

#### M1.1: Fix Timing Side-Channels

**Approach:** Import `crypto.timingSafeEqual` and create a helper function that all auth paths use.

**Key steps:**
1. Create `lib/safe-compare.ts` with `safeCompare(a: string, b: string): boolean`
2. Replace all `===` and `!==` comparisons on secrets with `safeCompare`
3. Add length check (timingSafeEqual requires equal-length buffers)

**Gotcha:** `timingSafeEqual` throws if buffers differ in length — must check length first or pad.

#### M1.2: Add Auth to Proxy Path

**Approach:** Move the auth bypass from the route-level middleware to a conditional inside the handler.

**Key steps:**
1. Remove the `if (req.path.startsWith('/proxy/')) return next()` bypass
2. Add auth check inside the proxy handler itself
3. Return 401 with proper error message for unauthenticated requests

**Gotcha:** The proxy is used by the gateway for agent communication — verify the gateway has the INTERNAL_API_KEY configured.

#### M2.1: Extract index.ts into Modules

**Approach:** Identify cohesive groups of functionality and extract into separate files.

**Key steps:**
1. Extract route mounting into `router.ts`
2. Extract Docker orchestration into `orchestration/docker.ts`
3. Extract health checks into `health.ts`
4. Extract auto-update logic into `auto-update.ts`
5. Keep `index.ts` as thin entry point that imports and wires modules

**Gotcha:** Circular dependencies — ensure extracted modules don't import from `index.ts`. Use dependency injection or shared context object.

---

## Open Questions

1. **Plan naming:** Should the billing page use solo/collective/label/network (backend) or starter/probe/scale (billing)? Which is the source of truth?
2. **Bridge client:** Is `web/public/bridge/client.js` actually deployed and used, or is it legacy code?
3. **Proxy auth:** Does the gateway have the INTERNAL_API_KEY to authenticate proxy requests?
4. **CryptoJS migration:** Are there existing encrypted wallet records that need migration when switching to Node crypto?
5. **Deployments endpoint:** Should `GET /api/deployments` return real data or be removed entirely?
6. **Testing priority:** Which core service should get tests first — ai.ts, wallet.ts, or bus.ts?
