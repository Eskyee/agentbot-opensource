---
task: Pre-launch audit for March 31st release
slug: 20260328-220000_prelaunch-audit
effort: deep
phase: complete
progress: 12/12
mode: interactive
started: 2026-03-28T22:00:00Z
updated: 2026-03-28T22:30:00Z
---

## Context

Full pre-launch audit of agentbot.raveculture.xyz ahead of March 31st 2026 go-live.
Covered: live smoke tests, security headers, auth flows, Stripe wiring, SEO, sitemap,
error pages, env var verification, dependency vulnerabilities.

## Criteria

- [x] ISC-1: Public routes return 200 (/, /pricing, /login, /api/health)
- [x] ISC-2: Auth redirect works (dashboard → login with callbackUrl)
- [x] ISC-3: Security headers present (CSP, X-Frame, nosniff, HSTS, Referrer, Permissions)
- [x] ISC-4: Stripe checkout flow returns correct response
- [x] ISC-5: Stripe webhook uses signature verification (not plain secret compare)
- [x] ISC-6: Plan names and prices correct across pricing + billing pages
- [x] ISC-7: SEO metadata, robots.txt, sitemap.xml, favicons present
- [x] ISC-8: Cron job configured in vercel.json and route exists
- [x] ISC-9: SKIP_AUTH_FOR_DEMO scope confirmed (groupie-manager only, not global)
- [x] ISC-10: No global console.log spam
- [x] ISC-11: Deprecated Stripe webhook route identified
- [x] ISC-12: Missing error/404 pages identified

## Decisions

1. Stripe webhook URL update is BLOCKING — must be done in Stripe dashboard before launch
2. not-found.tsx and error.tsx are medium priority — bare Next.js fallbacks shown on errors
3. /billing and /settings rely on client-side auth only — acceptable for beta but noted
4. CSP unsafe-eval + unsafe-inline accepted as standard Next.js trade-off

## Verification

### Live Smoke Tests (all pass)
- GET / → 200 (816ms) ✓
- GET /pricing → 200 (504ms) ✓
- GET /login → 200 (489ms) ✓
- GET /api/health → 200 (380ms) ✓
- GET /dashboard/cost → auth redirect to /login?callbackUrl=/dashboard/cost ✓
- GET /api/stripe/checkout?plan=solo → 303 (auth redirect) ✓
- GET /api/stripe/checkout?plan=invalid → 303 to /pricing?error=invalid_plan ✓

### Security Headers (all present on production)
- Content-Security-Policy ✓ (includes unsafe-eval/unsafe-inline — standard Next.js)
- X-Frame-Options: DENY ✓
- X-Content-Type-Options: nosniff ✓
- Referrer-Policy: strict-origin-when-cross-origin ✓
- Permissions-Policy ✓
- Strict-Transport-Security: max-age=63072000 ✓ (2yr HSTS)

### Stripe
- /api/webhooks/stripe → uses stripe.webhooks.constructEvent() with signature ✓
- /api/stripe/checkout → creates prices dynamically, no stale IDs ✓
- /api/stripe/webhook → DEPRECATED — forwards to /api/webhooks/stripe ⚠️ (see blocking)

### Plans
- solo £29, collective £69, label £149, network £499 — correct in pricing + billing pages ✓
- Checkout only accepts: solo, collective, label, network ✓

### SEO
- robots.txt present ✓
- sitemap.xml present ✓ (static — missing newer blog posts, medium priority)
- OG metadata on / and /pricing ✓
- SVG + PNG favicons ✓

### Cron
- vercel.json: /api/cron/cleanup at 0 2 * * * ✓
- app/api/cron/cleanup/route.ts exists ✓

---

## Launch Checklist

### 🔴 BLOCKING — must fix before launch

1. **Stripe webhook URL** — Update in Stripe Dashboard:
   - OLD: `https://agentbot.raveculture.xyz/api/stripe/webhook`
   - NEW: `https://agentbot.raveculture.xyz/api/webhooks/stripe`
   - Without this, subscription events (paid, cancelled, etc.) will not fire correctly

### 🟡 MEDIUM — fix before or shortly after launch

2. **Missing 404 page** — Create `web/app/not-found.tsx` with branded design
   - Currently shows bare Next.js default 404

3. **Missing error page** — Create `web/app/error.tsx` with branded design
   - Currently shows bare Next.js default error

4. **Sitemap outdated** — `web/public/sitemap.xml` is static XML
   - Missing: launch-week-2026-3-21, openclaw-2026-3-24 and any other new blog posts
   - Fix: add entries or switch to dynamic sitemap via /app/sitemap.ts

5. **Client-only auth on /billing and /settings**
   - proxy.ts only guards /dashboard/* — /billing and /settings use useCustomSession (client)
   - Low risk for beta but note for future hardening

### 🟠 MANUAL CHECKS — verify in Vercel dashboard before launch

6. **SKIP_AUTH_FOR_DEMO** — Confirm NOT set in Vercel production environment variables
   - Used only in groupie-manager skill route, but confirm it's absent from prod env

7. **STRIPE_WEBHOOK_SECRET** — Confirm set in Vercel production with the new /api/webhooks/stripe endpoint secret

8. **NEXTAUTH_URL** — Confirm set to `https://agentbot.raveculture.xyz` in production

9. **Dependabot alerts** — Review on GitHub before launch:
   - 1 critical, 10 high, 4 moderate, 1 low
   - At minimum: patch critical + high before go-live

### ✅ CONFIRMED GOOD — no action needed

- Auth proxy covers all /dashboard/* routes ✓
- Security headers: CSP, HSTS, X-Frame-Options, nosniff ✓
- Stripe signature verification on webhooks ✓
- Plan names and prices correct ✓
- SEO metadata, robots.txt, favicons ✓
- Cron job wired ✓
- No global auth bypass (SKIP_AUTH_FOR_DEMO is scoped) ✓
- No console.log spam (one in fleet page only) ✓
- All 27 dashboard page routes exist ✓
- All API routes wired correctly ✓
- Railway provisioning code reviewed + fixed ✓
- fix-openclaw one-time route deleted ✓
