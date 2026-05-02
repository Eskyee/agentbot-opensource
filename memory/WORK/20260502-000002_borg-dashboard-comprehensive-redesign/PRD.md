---
task: borg dashboard comprehensive redesign all features
slug: 20260502-000002_borg-dashboard-comprehensive-redesign
effort: advanced
phase: execute
progress: 0/28
mode: interactive
started: 2026-05-02T00:01:00Z
updated: 2026-05-02T00:01:00Z
---

## Context

User wants option D — full comprehensive upgrade of /dashboard/borg with richer data, real-time streaming, and a control surface. The soul API exposes: status (goals, beliefs, fitness, free_energy, brain, transformer, role, cortex, lifecycle, genesis, hivemind, synthesis, evaluation, recent_thoughts, cycle_health, active_plan), diagnostics, nudge, setModel, triggerBenchmark, chat. None of these beyond the basics are currently shown.

### Plan
1. `/web/app/api/colony/stream/route.ts` — new SSE route, polls soul every 5s, streams status events
2. `/web/app/api/colony/status/route.ts` — add POST handler: nudge/model/benchmark actions
3. `/web/app/dashboard/borg/page.tsx` — comprehensive rewrite: 12 panels, SSE client, control surface, delta animations

## Criteria

- [ ] ISC-1: SSE route exists at /api/colony/stream
- [ ] ISC-2: SSE route requires auth (401 on unauthenticated)
- [ ] ISC-3: SSE route emits `soul` events with soul status every 5s
- [ ] ISC-4: SSE route emits `error` events on soul unreachable
- [ ] ISC-5: SSE route closes cleanly after 55s (Vercel maxDuration 60s, client reconnects)
- [ ] ISC-6: POST /api/colony/status?action=nudge sends nudge to soul
- [ ] ISC-7: POST /api/colony/status?action=model sets model override
- [ ] ISC-8: POST /api/colony/status?action=benchmark triggers benchmark
- [ ] ISC-9: Page connects to SSE stream on mount
- [ ] ISC-10: Page falls back to 30s polling if SSE fails
- [ ] ISC-11: Live indicator shows green when SSE connected, amber when polling
- [ ] ISC-12: ActivePlanPanel renders current plan step + progress bar
- [ ] ISC-13: ActivePlanPanel shows goal description + replan count
- [ ] ISC-14: ThoughtStreamPanel renders last 5 recent_thoughts with type badges
- [ ] ISC-15: CycleHealthPanel shows completed/failed plans + stagnation risk
- [ ] ISC-16: DiagnosticsPanel shows bottleneck + recommendations list
- [ ] ISC-17: GenesisPanel shows top_templates from genesis
- [ ] ISC-18: HivemindPanel shows total_trails + swarm_intel
- [ ] ISC-19: CommandPanel has nudge text input + send button
- [ ] ISC-20: CommandPanel has model picker (auto/fast/smart/standard)
- [ ] ISC-21: CommandPanel has benchmark trigger button
- [ ] ISC-22: Metric cards show ↑↓ delta vs previous sample
- [ ] ISC-23: Delta values flash green (up) or red (down) on change
- [ ] ISC-24: All existing panels preserved (Fitness, FreeEnergy, Brain, Goals, Capabilities, Beliefs, Wallet)
- [ ] ISC-25: Null guards on all array fields (ISC from prior fix retained)
- [ ] ISC-26: TypeScript compiles without errors
- [ ] ISC-27: Page renders offline state gracefully (soul unreachable)
- [ ] ISC-28: No regressions in existing dashboard layout/navigation

## Decisions

## Verification
