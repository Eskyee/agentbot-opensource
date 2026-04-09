---
task: Verify and fix dashboard fleet page wiring
slug: 20260329-140000_fix-dashboard-fleet
effort: standard
phase: complete
progress: 6/6
mode: interactive
started: 2026-03-29T14:00:00Z
updated: 2026-03-29T14:01:00Z
---

## Context

/dashboard/fleet was wired but had two bugs preventing it from working correctly.

**What was correct (no changes needed):**
- `@tanstack/react-query` installed and `QueryClientProvider` wrapping app in `providers.tsx`
- Both API routes exist with `export const dynamic = 'force-dynamic'` correctly placed
- `OrganismCanvas` correctly imported from `@/components/dashboard/constellation/OrganismCanvas`
- `CloneButton` correctly imported from `@/app/components/shared/CloneButton`
- `ConstellationNode`/`ConstellationEdge` types match what graph API returns
- `STATUS_COLORS` fallback handles unknown statuses (e.g. 'stale' → offline colour)
- `store/dashboard.ts` with `useDashboardStore` exists

**Bugs found and fixed:**

1. **Traces type mismatch** — `ExecutionTrace` expected `AgentTask` shape
   (`description`, `completedAt`, `tokensUsed`, `costUSD`) but traces route
   returned raw shape (`label`, `duration`, `tokens`).
   Result: blank labels and "running..." for every trace entry.
   Fix: transform to AgentTask in the route before returning.

2. **`selectedAgent.type` undefined** — fleet page rendered `selectedAgent.type`
   in the quick view but graph nodes have `role`, not `type`.
   Fix: `selectedAgent.role ?? selectedAgent.type`.

## Criteria

- [x] ISC-1: @tanstack/react-query installed and QueryClientProvider wrapping app
- [x] ISC-2: OrganismCanvas resolves correctly (@/components/dashboard/constellation/)
- [x] ISC-3: ExecutionTrace traces show real descriptions (not blank)
- [x] ISC-4: Completed traces show real elapsed time (not "running...")
- [x] ISC-5: Selected agent quick view shows role (orchestrator/worker/specialist)
- [x] ISC-6: Both fleet API routes marked force-dynamic with correct fallbacks

## Decisions

- Transform traces to AgentTask shape in the API layer — keeps component clean
- `selectedAgent.role ?? selectedAgent.type` — safe fallback for forward compat
