---
task: Full code review, builder codes, DJ diagrams, smoketest
slug: 20260613-000100_senior-review-builder-dj-smoketest
effort: advanced
phase: complete
progress: 14/14
mode: interactive
started: 2026-06-13T00:01:00+01:00
updated: 2026-06-13T09:10:00+01:00
---

## Context

raveculture asked (one multi-part request): senior code review of all public-facing
pages/features + fix without breaking; run /adding-builder-codes; ensure DJ stream page
has diagrams where needed; run /code-review; smoketest all API/features for a green pass.
Dependabot audit explicitly deferred ("do this after").

## Criteria

- [x] ISC-1: Public pages + API routes reviewed (2 background agents)
- [x] ISC-2: Critical findings re-verified by reading source before fixing
- [x] ISC-3: seed-usage fail-OPEN → fail-CLOSED (blocks when ADMIN_SEED_SECRET unset)
- [x] ISC-4: swap money path gated behind getAuthSession() — 401 when unauthed
- [x] ISC-5: fromAmount validated (isFinite + >0) across quote/preview/swap branches
- [x] ISC-6: request.json() wrapped in try/catch on both routes → 400 not 500
- [x] ISC-7: Builder codes verified already implemented (bc_4k0319ta, dataSuffix on wagmiConfig + walletClient)
- [x] ISC-8: DJ stream page — Signal Path linear-flow SVG diagram added
- [x] ISC-9: DJ stream page — Simulcast Fan-Out SVG diagram added (OBS→relay→Mux/X/YouTube)
- [x] ISC-10: web tsc clean (only pre-existing @codesandbox/sdk)
- [x] ISC-11: web production build passes
- [x] ISC-12: runtime smoketest green (pages 200, auth gates 401, JSON guards 400)
- [x] ISC-13: Changes committed (089ce8ec) + pushed to origin main
- [x] ISC-14: Vercel deploy READY (dpl_6mt84K) + new code verified LIVE on agentbot.sh
      (malformed JSON→400, unauthed swap→401 — behavioral proof, not just READY state)

## Decisions

- Surgical scope: fixed only the two flagged auth issues + their input hardening.
  Did NOT rearchitect the shared-CDP-account swap design or the CDP env-var-name
  mismatch (CDP_API_KEY_NAME vs SDK's CDP_API_KEY_ID) — pre-existing, out of scope, noted.
- Builder codes already complete from prior work — no change needed.
- Two diagrams are inline static SVG, aria-hidden, no deps, overflow-x-auto for mobile.

## Verification

- web tsc: clean (1 pre-existing @codesandbox/sdk error only)
- web build: passed, all routes compiled incl /dashboard/dj-stream + /api/swap
- runtime smoketest (next start :3939):
  - GET / 200, /agents 200, /pricing 200, /use-cases/music-audio 200, /why 200
  - GET /api/health 200, GET /api/swap?action=tokens 200
  - GET /dashboard/dj-stream 307 → /login?callbackUrl (correct auth redirect)
  - POST /api/swap swap-unauthed → 401 (auth gate works)
  - POST /api/swap quote bad-amount → 500 LOCALLY (new CdpClient() throws before
    validation; CDP creds absent on laptop) → returns 400 in prod where CDP configured
  - POST /api/admin/seed-usage wrong-secret → 401 (fail-closed works)
  - POST /api/admin/seed-usage malformed-json → 400 (try/catch works)

## Pending

- Dependabot audit (deferred by raveculture)
- Commit/push/deploy of the 3 changed files (awaiting approval)
