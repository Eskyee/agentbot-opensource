---
task: Code review and smoke test agentbot
slug: 20260328-210000_code-review-smoke-test
effort: extended
phase: complete
progress: 6/6
mode: interactive
started: 2026-03-28T21:00:00Z
updated: 2026-03-28T21:15:00Z
---

## Context

Code review of 4 files changed in last 3 commits, plus smoke test of live production endpoints.

Files reviewed: provision/team/route.ts, provision/team/templates/route.ts, railway-provision.ts, fix-openclaw/route.ts

## Criteria

- [x] ISC-1: provision/team/route.ts reviewed for bugs and security
- [x] ISC-2: provision/team/templates/route.ts reviewed
- [x] ISC-3: railway-provision.ts reviewed
- [x] ISC-4: fix-openclaw/route.ts reviewed
- [x] ISC-5: Smoke tests pass on production endpoints
- [x] ISC-6: All code review issues fixed and pushed

## Decisions

1. Used after() from next/server instead of bare Promise.allSettled fire-and-forget
2. Deleted fix-openclaw route (one-time use, hardcoded IDs, query-param auth)
3. Fixed stale comment in railway-provision.ts

## Verification

### Smoke Tests (all pass)
- GET /api/health → 200 {"status":"ok"} ✓ (154ms)
- GET /api/provision/team/templates → 401 {"error":"Unauthorized"} ✓ (408ms)
- POST /api/provision/team → 401 {"error":"Unauthorized"} ✓ (334ms)
- GET /api/admin/fix-openclaw?key=wrong → 401 ✓ (496ms)
- POST /api/provision → 401 {"success":false,"error":"Authentication required"} ✓
- GET / → 200 ✓ (173ms)

### Code Review Issues Found & Fixed
- BUG (fixed): Promise.allSettled fire-and-forget → wrapped in after()
- STALE COMMENT (fixed): ~/.openclaw → /tmp/openclaw.json
- SECURITY (fixed): fix-openclaw route deleted — had hardcoded Railway IDs + query-param auth
