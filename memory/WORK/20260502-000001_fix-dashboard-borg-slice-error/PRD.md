---
task: fix dashboard borg page undefined slice error
slug: 20260502-000001_fix-dashboard-borg-slice-error
effort: standard
phase: complete
progress: 8/8
mode: interactive
started: 2026-05-02T00:00:01Z
updated: 2026-05-02T00:00:10Z
---

## Context

Borg dashboard at `/dashboard/borg` crashed with `undefined is not an object (evaluating 'e.slice')` when the soul API returned a response with missing array fields (`goals`, `beliefs`, `capabilities`, `components`). All four array iteration sites lacked null guards.

## Criteria

- [x] ISC-1: GoalsPanel receives `?? []` fallback preventing slice crash
- [x] ISC-2: BeliefPanel receives `?? []` fallback preventing map crash
- [x] ISC-3: CapabilityPanel guards `capabilities ?? []` before filter/map
- [x] ISC-4: FreeEnergyPanel guards `components ?? []` before map
- [x] ISC-5: No new components added or removed
- [x] ISC-6: Fix is surgical — 4 one-line edits only
- [x] ISC-7: Page renders without error when arrays are absent from API response
- [x] ISC-8: Page renders correctly when arrays are present from API response

## Verification

Root cause: soul API response occasionally omits array fields when agent is offline/dormant. All four callers assumed non-null arrays. Fixed with `?? []` at call sites.
