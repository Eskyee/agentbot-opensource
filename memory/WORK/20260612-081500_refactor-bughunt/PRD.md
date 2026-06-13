---
task: Refactor pass and verified bug hunt across agentbot
slug: 20260612-081500_refactor-bughunt
effort: advanced
phase: observe
progress: 0/26
mode: interactive
started: 2026-06-12T08:15:00+01:00
updated: 2026-06-12T08:15:00+01:00
---

## Context

raveculture asked for a refactor + bug-fix pass over agentbot. Previous passes covered: brand sweep, perf caching, nav/breadcrumbs, coding-agent wiring, playground, landing, 2 backend hardening fixes. This pass targets UNCOVERED areas: web API routes (auth/payment critical), web lib/hooks, backend routes/services. Hard rule from last session: every reviewer finding must be re-verified by reading code before fixing (4 of 15 backend findings were hallucinated last time).

## Criteria

- [ ] ISC-1: Web API routes reviewed for verified bugs
- [ ] ISC-2: Web lib and hooks reviewed for verified bugs
- [ ] ISC-3: Backend routes and services reviewed for verified bugs
- [ ] ISC-4: Every applied fix re-verified against source first
- [ ] ISC-5: At least one duplication refactor identified
- [ ] ISC-6: Refactors limited to verified safe consolidations
- [ ] ISC-7: All fixes are surgical minimal diffs
- [ ] ISC-8: No component deleted as a fix
- [ ] ISC-9: False reviewer findings documented and rejected
- [ ] ISC-10: web tsc shows no new errors from changes
- [ ] ISC-11: backend tsc shows no new errors from changes
- [ ] ISC-12: web production build passes
- [ ] ISC-13: backend jest suite passes same as baseline
- [ ] ISC-14: design:check still passes
- [ ] ISC-15: Local smoke test homepage 200
- [ ] ISC-16: Local smoke test changed routes 200
- [ ] ISC-17: Changes committed with scoped message
- [ ] ISC-18: Postman dirty files left untouched
- [ ] ISC-19: Push to origin main succeeds
- [ ] ISC-20: Vercel deployment for new commit READY
- [ ] ISC-21: Rolling release completed to 100 percent
- [ ] ISC-22: Domain alias deploymentId matches new deployment
- [ ] ISC-23: Production URL responds 200 post-promote
- [ ] ISC-24: Fix list reported with file references
- [ ] ISC-A1: No secrets printed or committed
- [ ] ISC-A2: No speculative fixes without code evidence

## Decisions

## Verification
