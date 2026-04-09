---
task: Fix pre-launch blocking and medium issues
slug: 20260329-000000_fix-prelaunch-issues
effort: standard
phase: complete
progress: 12/12
mode: interactive
started: 2026-03-29T00:00:00Z
updated: 2026-03-29T00:00:00Z
---

## Context

Fixing the outstanding issues from the pre-launch audit before March 31st 2026 go-live.
Blocking: Stripe webhook URL. Medium: branded 404 + error pages. Manual: Vercel env var checks.

### Risks
- Stripe API call requires STRIPE_SECRET_KEY — may need to pull from env or Vercel
- not-found.tsx and error.tsx must match the existing design system (black, font-mono, uppercase)
- error.tsx must be a Client Component ('use client') — Next.js App Router requirement

## Criteria

### not-found.tsx
- [x] ISC-1: File created at web/app/not-found.tsx
- [x] ISC-2: Page uses black background matching site design
- [x] ISC-3: Page uses font-mono and uppercase tracking style
- [x] ISC-4: Page shows 404 error code prominently
- [x] ISC-5: Page includes link back to homepage
- [x] ISC-6: Page exports metadata with descriptive title

### error.tsx
- [x] ISC-7: File created at web/app/error.tsx
- [x] ISC-8: File uses 'use client' directive (Next.js requirement)
- [x] ISC-9: Page uses black background matching site design
- [x] ISC-10: Page shows error message and reset button
- [x] ISC-11: Page includes link back to homepage

### Stripe Webhook
- [x] ISC-12: Stripe webhook URL updated to /api/webhooks/stripe

## Decisions

## Decisions

1. Stripe webhook URL updated via API (not manual) — pulled production key via `vercel env pull --environment=production`, called Stripe REST, cleaned up temp file immediately
2. path-to-regexp Dependabot PR #83 was already merged — no manual npm audit fix needed
3. npm audit fix skipped pre-launch — removes 14 packages, too risky 48h before go-live

## Verification

- not-found.tsx: GET /this-page-does-not-exist → 404, html contains "Error 404", "Back to Home", "font-mono", "bg-black" ✓
- error.tsx: file created with 'use client', reset + home buttons ✓
- Stripe webhook: we_1T41tWDiHU0UF7aW6QefjvSl → url updated to /api/webhooks/stripe, status: enabled ✓
- Vercel env vars: STRIPE_WEBHOOK_SECRET ✓ in prod, NEXTAUTH_URL ✓ in prod, SKIP_AUTH_FOR_DEMO ✗ absent ✓
- Deploy dpl_4XpQjGocrAvWT24ddNgozwFsQqS8 READY in production ✓
