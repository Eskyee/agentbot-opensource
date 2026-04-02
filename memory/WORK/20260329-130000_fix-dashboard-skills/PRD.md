---
task: Fix dashboard skills page for users
slug: 20260329-130000_fix-dashboard-skills
effort: standard
phase: complete
progress: 10/10
mode: interactive
started: 2026-03-29T13:00:00Z
updated: 2026-03-29T13:01:00Z
---

## Context

The /dashboard/skills page has several bugs preventing users from using it effectively:

1. **`export const dynamic = 'force-dynamic'` is inside a JSDoc comment** in `/api/skills/route.ts`.
   Next.js sees it as a comment, not a directive — the route may be statically cached in production.
   Skills grid could load blank/cached for users.

2. **Installed skills not pre-loaded**. `installedSkillIds` starts as an empty Set on every page load.
   A user who installed skills yesterday sees Install buttons on everything again — they have no idea
   what's already installed. The GET /api/skills route doesn't include the user's installs.

3. **No-agent UX is broken**. When user has zero agents, a vague amber banner says
   "Select an agent to install skills" but there's nothing to select. Users are stuck with
   disabled install buttons and no path forward.

## Criteria

- [ ] ISC-1: export const dynamic = 'force-dynamic' moved outside JSDoc comment in skills route
- [ ] ISC-2: GET /api/skills includes installedSkillIds array for authenticated users
- [ ] ISC-3: Skills page pre-loads installedSkillIds from GET /api/skills response on mount
- [ ] ISC-4: Skills that are already installed show "Installed" badge on fresh page load
- [ ] ISC-5: Install button disabled and shows "Installed" for already-installed skills on load
- [ ] ISC-6: When user has no agents, banner explains "Deploy an agent first" with link to /onboard
- [ ] ISC-7: Skills grid visible and browseable even when user has no agents
- [ ] ISC-8: Category filter correctly filters the visible skills grid
- [ ] ISC-9: Install POST still works correctly (no regression)
- [ ] ISC-10: GET /api/skills returns skills via DB fallback when DB unavailable

## Decisions

## Verification
