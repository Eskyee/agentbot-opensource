---
task: Ensure all plans deploy OpenClaw correctly
slug: 20260329-120000_all-plans-deploy-openclaw
effort: extended
phase: complete
progress: 22/22
mode: interactive
started: 2026-03-29T12:00:00Z
updated: 2026-03-29T12:01:00Z
---

## Context

User wants two things confirmed and fixed:
1. All 4 pricing plans (Solo/Collective/Label/Network) deploy an OpenClaw container for the user on purchase
2. The pricing page features match their spec exactly

**Current gaps found:**
- Solo feature copy is wrong: shows "Fan engagement" + "BlockDB queries for A&R" but user spec says "Audience engagement" + "Opportunity discovery"
- `/api/provision` route does NOT exist in the Next.js frontend — checkout success page calls this and gets a 404
- Backend provision route requires a channel token even for auto-provision — checkout success doesn't have one, gets 400
- Both pricing.ts and pricing/page.tsx need solo feature copy updates

**What does NOT need changing:**
- Pricing amounts (£29/69/149/499) — correct
- Collective/Label/Network features — already match spec
- Container-manager Railway logic — already correct for all 4 plans
- Stripe checkout flow — already correct

### Risks
- Auto-provision currently broken for ALL plans (404 on /api/provision) — need to create proxy route
- Internal auth between frontend and backend needs to work (INTERNAL_API_KEY)
- Creating the proxy route exposes the provision endpoint — need auth guard

## Criteria

- [x] ISC-1: Solo pricing card shows "Audience engagement (Telegram)" not "Fan engagement"
- [x] ISC-2: Solo pricing card shows "Opportunity discovery" not "BlockDB queries for A&R"
- [x] ISC-3: Collective pricing card features unchanged and correct
- [x] ISC-4: Label pricing card features unchanged and correct
- [x] ISC-5: Network pricing card features unchanged and correct
- [x] ISC-6: lib/pricing.ts solo features array updated to match new copy
- [x] ISC-7: Next.js `/api/provision` route file exists at web/app/api/provision/route.ts
- [x] ISC-8: Provision proxy route requires authenticated session before forwarding
- [x] ISC-9: Provision proxy route forwards user email as X-User-Email header
- [x] ISC-10: Provision proxy route passes INTERNAL_API_KEY as Authorization bearer
- [x] ISC-11: Provision proxy route returns backend response with correct status code
- [x] ISC-12: Backend provision route allows autoProvision:true without channel token
- [x] ISC-13: Backend provision still requires channel token when autoProvision is not true
- [x] ISC-14: Backend provision creates Railway container for solo plan on auto-provision
- [x] ISC-15: Backend provision creates Railway container for collective plan on auto-provision
- [x] ISC-16: Backend provision creates Railway container for label plan on auto-provision
- [x] ISC-17: Backend provision creates Railway container for network plan on auto-provision
- [x] ISC-18: Backend returns success:true with container info on auto-provision
- [x] ISC-19: Checkout success page provisionStatus shows 'done' on successful provision
- [x] ISC-20: lib/pricing.ts TIER_FEATURES solo.business remains false (solo is creative-only)
- [x] ISC-21: No breaking changes to existing channel provision flow (with token)
- [x] ISC-A1: Solo plan openclowSeats limit NOT changed (0 business seats is correct)

## Decisions

## Verification
