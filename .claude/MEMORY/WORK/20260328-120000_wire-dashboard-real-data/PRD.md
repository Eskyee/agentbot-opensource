---
task: Wire dashboard pages real data fix nav
slug: 20260328-120000_wire-dashboard-real-data
effort: deep
phase: complete
progress: 42/42
mode: interactive
started: 2026-03-28T12:00:00Z
updated: 2026-03-28T12:35:00Z
---

## Context
Wire six dashboard pages to real data, remove /dashboard/x402 from top Navbar (desktop + mobile), make tech-updates OpenClaw-focused.

### Plan
1. Navbar — remove x402 link (desktop line 57, mobile line 125)
2. Tasks — add agent selector, wire delete/toggle, fix agentId hardcode
3. Files — remove agentId=default, add agent selector for upload, wire delete
4. Skills — dynamic categories from API, fix install agentId, no alert()
5. Personality — load saved state on mount, fix agentId, no alert()
6. Tech Updates — add openclaw category + live soul data, keep static items

## Criteria
- [ ] ISC-1: Navbar x402 link removed from desktop logged-in nav
- [ ] ISC-2: Navbar x402 link removed from mobile Navigate section
- [ ] ISC-3: Tasks page fetches user's agents on mount
- [ ] ISC-4: Tasks create form shows agent dropdown
- [ ] ISC-5: Tasks create form uses selected real agentId not "default"
- [ ] ISC-6: Tasks list shows all tasks for user across agents
- [ ] ISC-7: Each task row has working toggle (enabled/disabled)
- [ ] ISC-8: Each task row has working delete button
- [ ] ISC-9: Tasks empty state shown when no tasks exist
- [ ] ISC-10: Tasks no-agents state shown when user has no agents
- [ ] ISC-11: Files page fetches all user files (no agentId filter)
- [ ] ISC-12: Files upload uses real agent selector
- [ ] ISC-13: Files delete button wired to DELETE /api/files
- [ ] ISC-14: Files shows file MIME type icon indicator
- [ ] ISC-15: Files shows download link per file
- [ ] ISC-16: Skills categories loaded dynamically from API
- [ ] ISC-17: Skills install uses real agent selector
- [ ] ISC-18: Skills shows installed badge for already-installed skills
- [ ] ISC-19: Skills feedback uses toast/inline not alert()
- [ ] ISC-20: Personality loads saved personality on mount
- [ ] ISC-21: Personality fetches user's agents on mount
- [ ] ISC-22: Personality uses real agentId not "default"
- [ ] ISC-23: Personality save feedback inline not alert()
- [ ] ISC-24: Personality shows empty state when no agents
- [ ] ISC-25: Tech Updates has openclaw category option
- [ ] ISC-26: Tech Updates openclaw items fetch live colony/soul data
- [ ] ISC-27: Tech Updates shows OpenClaw fitness score F as item
- [ ] ISC-28: Tech Updates shows recent agent outcomes as items
- [ ] ISC-29: Tech Updates shows brain/cortex/genesis metrics
- [ ] ISC-30: Tech Updates auto-refreshes openclaw data every 60s
- [ ] ISC-31: Tech Updates static items remain unchanged
- [ ] ISC-32: Tech Updates last-updated timestamp shows real fetch time
- [ ] ISC-33: All pages compile without TypeScript errors
- [ ] ISC-34: No page uses alert() for user feedback
- [ ] ISC-35: No page uses hardcoded agentId: "default"
- [ ] ISC-36: Tasks cron schedule shows human-readable next run
- [ ] ISC-37: Skills page shows categories from DB not hardcoded list
- [ ] ISC-38: Files shows empty state with helpful message when no files
- [ ] ISC-39: Personality shows current selected personality type on load
- [ ] ISC-40: Tech Updates openclaw section shows agent version
- [ ] ISC-41: All pages handle API errors gracefully without crashing
- [ ] ISC-42: Build passes with no type errors after changes

## Decisions
- Use inline toast-style feedback instead of alert()
- Fetch agents from /api/agents and use first agent as default selection
- Tech updates openclaw section fetches /api/colony/status
- Files page removes agentId filter from GET (shows all user files)

## Verification
