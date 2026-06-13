---
task: Nav, breadcrumbs, coding-agent parity, playground polish, landing diagram
slug: 20260611-221500_nav-breadcrumbs-coding-agent
effort: advanced
phase: complete
progress: 26/26
mode: interactive
started: 2026-06-11T22:15:00+01:00
updated: 2026-06-11T22:15:00+01:00
---

## Context

raveculture asked: improve landing page + diagrams, add breadcrumbs, improve menus/navigation site-wide, mobile ready, make /coding-agent fully work like /vercel-gateway and add to menu, improve /playground (flagship) like a senior engineer. Key finding: coding-agent client never uses its real backend (sends wrong payload — sessionId missing → 400; hardcoded demo sessions; ignores SSE stream).

## Criteria

- [x] ISC-1: Breadcrumbs component exists deriving trail from pathname
- [x] ISC-2: Breadcrumbs emit schema.org BreadcrumbList JSON-LD
- [x] ISC-3: Breadcrumbs hidden on homepage and auth pages
- [x] ISC-4: Breadcrumbs mounted site-wide via root layout
- [x] ISC-5: Desktop nav has Products dropdown with 4 links
- [x] ISC-6: Products dropdown closes on outside click
- [x] ISC-7: Coding Agent link present in desktop nav
- [x] ISC-8: Mobile menu lists product links both auth states
- [x] ISC-9: Mobile menu has grouped section labels
- [x] ISC-10: Coding-agent loads real sessions from GET API
- [x] ISC-11: Coding-agent creates sessions via POST API
- [x] ISC-12: Coding-agent chat sends sessionId to chat API
- [x] ISC-13: Coding-agent renders SSE stream incrementally
- [x] ISC-14: Coding-agent shows sign-in gate when 401
- [x] ISC-15: Coding-agent accents brand-aligned to orange
- [x] ISC-16: Playground improved with at least 3 targeted fixes
- [x] ISC-17: Landing page gains How-it-works diagram section
- [x] ISC-18: Diagram is inline SVG, mobile responsive
- [x] ISC-19: design:check passes after all changes
- [x] ISC-20: web tsc compile passes
- [x] ISC-21: web production build passes
- [x] ISC-22: Local smoke test all changed pages 200
- [x] ISC-23: Push triggers Vercel deploy reaching READY
- [x] ISC-24: Production URL 200 post-deploy
- [x] ISC-A1: No playground rewrite — surgical diffs only
- [x] ISC-A2: Postman dirty files untouched

## Decisions

- coding-agent fix is client-side wiring to existing backend (no backend rewrite needed).
- Breadcrumbs auto-derived (no per-page config) to cover whole site instantly.

## Verification

## Verification

- Build exit 0 (web-build5.log); design:check passed; my files zero tsc errors
- Smoke local :3078 — /, /coding-agent, /playground, /vercel-gateway, /blog, /bankr all 200; breadcrumb nav + JSON-LD in /blog HTML; Products in client bundle
- Prod DB: metadata column EXISTS (information_schema query via prod DATABASE_URL)
- Deploy dpl_9NXqfDrcGd3oHGXuLNf3VDhQNeew (b149e546) READY; Rolling Release completed to 100%; agentbot.sh alias -> dpl_9NXqf...; live /blog breadcrumb=1, / How-it-works=1
- Bankr CLI authenticated, balances API responding; Bankr + Robinhood in sidebar Finance section
