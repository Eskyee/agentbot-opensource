---
task: Review if OpenClaw user deploy works error-free
slug: 20260328-091536_openclaw-deploy-review
effort: advanced
phase: learn
progress: 28/28
mode: interactive
started: 2026-03-28T09:15:36Z
updated: 2026-03-28T09:25:00Z
---

## Context

Review and fix the full OpenClaw user deployment flow — from `/onboard?mode=deploy` through to the dashboard successfully showing the instance. Two critical blockers identified that cause 100% failure after a successful provision.

### Flow Under Review
1. User visits `/onboard?mode=deploy&plan=solo&paid=1`
2. Clicks Deploy → calls `POST /api/provision`
3. `/api/provision` validates session + subscription, calls backend `POST /api/provision`
4. Backend creates Mux stream, hex agentId, calls Render API to spin up container
5. Returns `{ success: true, userId: "hexAgentId" }` — stored to localStorage
6. User goes to `/dashboard` → reads localStorage userId
7. Dashboard calls `GET /api/instance/{hexAgentId}` → **BLOCKER: always 403**

### Risks
- Auth mismatch breaks dashboard for ALL provisioned users
- Missing userId field in agents route breaks the agents-API fallback entirely
- Both bugs compound: all 3 fallback paths in the dashboard fail

## Criteria

- [ ] ISC-1: `/api/instance/[userId]` auth does not compare session.user.id to agentId
- [ ] ISC-2: `/api/instance/[userId]` auth verifies user OWNS the instance via DB lookup
- [ ] ISC-3: `/api/instance/[userId]` returns 200 for valid owner with valid agentId
- [ ] ISC-4: `/api/instance/[userId]` returns 403 for user who does NOT own the instance
- [ ] ISC-5: `/api/instance/[userId]` returns 403 when no session exists
- [ ] ISC-6: `/api/agents/route.ts` GET select includes `userId` field
- [ ] ISC-7: Dashboard agents fallback `agentsData.agents[0].userId` resolves to a real value
- [ ] ISC-8: No TypeScript errors introduced by the fix
- [ ] ISC-9: Auth fix uses prisma.user.findUnique to look up openclawInstanceId
- [ ] ISC-10: Auth fix handles null openclawInstanceId gracefully (returns 403, not 500)
- [ ] ISC-11: Auth fix handles Prisma errors gracefully (does not crash route)
- [ ] ISC-12: Provision subscriptionStatus check — documented timing race condition
- [ ] ISC-13: Backend plan validation accepts all 4 plans: solo/collective/label/network
- [ ] ISC-14: `tierLimits` in `/api/agents/provision` uses correct plan names
- [ ] ISC-15: BACKEND_API_URL configured (verified via api-keys.ts env check)
- [ ] ISC-16: INTERNAL_API_KEY configured (verified via api-keys.ts env check)
- [ ] ISC-17: `/api/openclaw-version` returns valid response (route exists, verified)
- [ ] ISC-18: `/api/stripe/checkout` route exists and handles all 4 valid plans
- [ ] ISC-19: Dashboard "No instance found" shown for user with no deployed agent
- [ ] ISC-20: Dashboard shows correct instance status after deploy (not "Unauthorized")
- [ ] ISC-A21: Fix does NOT change the response shape of `/api/instance/[userId]`
- [ ] ISC-A22: Fix does NOT break the `/api/instance/[userId]/stats` sibling route
- [ ] ISC-A23: Fix does NOT trust body email for auth (session email only)
- [ ] ISC-A24: Fix does NOT introduce any code that could expose one user's instance to another
- [ ] ISC-25: Both files committed and pushed to main
- [ ] ISC-26: Render API env vars (RENDER_API_KEY, RENDER_OWNER_ID) documented as required
- [ ] ISC-27: `container-manager.ts` repo URL matches actual GitHub repo
- [ ] ISC-28: Plan name mismatch in tierLimits documented as non-critical (wrong path)

## Decisions

- Fix `/api/instance/[userId]/route.ts` auth by doing prisma.user.findUnique and checking openclawInstanceId === userId
- DO NOT change the URL structure — userId is the hex agentId and that's fine
- Add `userId: true` to `/api/agents/route.ts` select (low risk, needed for fallback)
- Plan mismatch in `/api/agents/provision/route.ts` is non-critical: primary deploy path is `/api/provision`, not `/api/agents/provision`
- `/api/provision` (legacy) is the REAL provision path used by the onboard page
- Render API credentials: RENDER_API_KEY + RENDER_OWNER_ID must be set; repo URL hardcoded to github.com/Eskyee/agentbot (correct)

## Verification

