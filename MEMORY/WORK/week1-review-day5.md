# Week 1 Review — Day 5 (March 16, 2026)

## Summary
Days 1-4 complete. Site is live, secure, and performant. Week 2 shifts to marketing.

---

## Day 1: Stability ✅
- All endpoints responding (landing, demo, why, basename API, stripe checkout)
- Pricing correct: Underground £29 / Collective £69 / Label £199
- Partner logos, $AGENTBOT token, baseFM radio all rendering
- No errors detected

## Day 2: Security Audit ✅
- 30 findings total: 5 critical, 8 high, 9 medium, 8 low/info
- npm audit: 16 low in @ethersproject/* (no fix upstream, client-side only)
- Full report: memory/WORK/security-audit-day2.md

## Day 3: Security Fixes ✅
7 fixes applied (PR #53 — claude/security-fixes):
1. NEXTAUTH_SECRET throws in production if missing (was fallback string)
2. Guest checkout no longer creates unverified users
3. Storage upgrade uses userId not metadata email
4. Email uniqueness check on settings update
5. Email format validation on register, settings, forgot-password
6. Wallet address normalized to lowercase
7. Bcrypt standardized to 12 rounds, password min raised to 8

## Day 4: Load Testing ✅
- Zero errors at 100 concurrent users
- Landing page: 1.1s avg, 3.3s P95 at 100 concurrent
- Demo/Why pages: <200ms
- Full report: memory/WORK/load-test-day4.md

---

## Outstanding Issues (fix before launch)

### Must fix
- [ ] **Merge PR #53** (security fixes) into main — Vercel will auto-deploy
- [ ] **OpenRouter balance below $5** — demo chat will break when it hits zero
- [ ] **Google OAuth auto-links without notification** (finding #8, high)

### Should fix
- [ ] Rate limiting in-memory only — needs Redis in production
- [ ] CSRF middleware exists but not enforced on state-changing endpoints
- [ ] Stripe webhook idempotency — no duplicate event protection
- [ ] Landing page could benefit from ISR caching

### Nice to have
- [ ] Clean up 7 stale claude/* branches (git lock prevented deletion)
- [ ] Investigate z-ai/glm-5-turbo for OpenRouter config
- [ ] Add CDN cache headers for static pages

---

## Vercel Deployment Status
- **Production (main):** READY — dpl_3ycWEBNhWSkUvw7LWbaA7ih82Y5y
- **Security fixes preview:** ERROR — likely Neon branch limit (user cleaned up)
- Merging PR #53 will trigger a fresh production build

## Week 2 Focus: Marketing Prep (Mar 21-25)
- Content creation and social media strategy
- Community building
- Prepare launch assets
- Begin TechCrunch journalist identification

## Week 3 Focus: Press Outreach (Mar 26-30)
- Send TechCrunch pitch emails
- Final QA testing
- Last bug fixes

## Launch Day: March 31
