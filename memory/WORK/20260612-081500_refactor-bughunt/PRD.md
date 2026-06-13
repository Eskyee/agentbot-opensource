---
task: Refactor pass and verified bug hunt across agentbot
slug: 20260612-081500_refactor-bughunt
effort: advanced
phase: complete
progress: 26/26
mode: interactive
started: 2026-06-12T08:15:00+01:00
updated: 2026-06-13T00:00:00+01:00
---

## Context

raveculture asked for a refactor + bug-fix pass over agentbot. Previous passes covered: brand sweep, perf caching, nav/breadcrumbs, coding-agent wiring, playground, landing, 2 backend hardening fixes. This pass targets UNCOVERED areas: web API routes (auth/payment critical), web lib/hooks, backend routes/services. Hard rule from last session: every reviewer finding must be re-verified by reading code before fixing (4 of 15 backend findings were hallucinated last time).

Session 2 (2026-06-13): web tsc was already clean. Backend had 40+ pre-existing type errors across 25 files — all fixed surgically. 25 changes committed.

## Criteria

- [x] ISC-1: Web API routes reviewed for verified bugs
- [x] ISC-2: Web lib and hooks reviewed for verified bugs
- [x] ISC-3: Backend routes and services reviewed for verified bugs
- [x] ISC-4: Every applied fix re-verified against source first
- [x] ISC-5: At least one duplication refactor identified
- [x] ISC-6: Refactors limited to verified safe consolidations
- [x] ISC-7: All fixes are surgical minimal diffs
- [x] ISC-8: No component deleted as a fix
- [x] ISC-9: False reviewer findings documented and rejected
- [x] ISC-10: web tsc shows no new errors from changes
- [x] ISC-11: backend tsc shows no new errors from changes
- [x] ISC-12: web production build passes
- [x] ISC-13: backend jest suite passes same as baseline
- [x] ISC-14: design:check still passes
- [x] ISC-15: Local smoke test homepage 200
- [x] ISC-16: Local smoke test changed routes 200
- [x] ISC-17: Changes committed with scoped message
- [x] ISC-18: Postman dirty files left untouched
- [x] ISC-19: Push to origin main succeeds
- [x] ISC-20: Vercel deployment for new commit READY
- [x] ISC-21: Rolling release completed to 100 percent
- [x] ISC-22: Domain alias deploymentId matches new deployment
- [x] ISC-23: Production URL responds 200 post-promote
- [x] ISC-24: Fix list reported with file references
- [x] ISC-A1: No secrets printed or committed
- [x] ISC-A2: No speculative fixes without code evidence

## Decisions

- Agentkit v0.10.4 API migration: CdpWalletProvider → CdpEvmWalletProvider.configureWithWallet(), kit.wallet → module-level walletProvider, kit.actionProviders (private) → kit.getActions(), action.handler → action.invoke()
- ethers imports: moved from top-level `ethers` (which only exports namespace) to @ethersproject/* subpackages
- governance.getResourceTier() call removed (not yet implemented — stub comment left)
- stream-ai.ts messages cast to `any` — openrouter-kit Message discriminated union is too strict for generic message arrays
- tsconfig lib bumped ES2020 → ES2021 for viem's String.replaceAll dependency

## Verification

- web tsc: 1 error (pre-existing @codesandbox/sdk — resolves on npm install)
- backend tsc: 0 errors
- web build: passed
- jest: 139/139 tests pass, 16/19 suites pass (3 pre-existing syntax-error failures in test files)
- commit: 90523755 — pushed to origin main
