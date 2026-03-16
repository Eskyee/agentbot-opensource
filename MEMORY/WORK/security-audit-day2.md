# Security Audit — Day 2 (March 16, 2026)

## npm audit
16 low severity vulnerabilities — all in `@ethersproject/*` (elliptic curve library). No fix available upstream. These are transitive dependencies from `@base-org/account`. Risk is low — only affects client-side wallet signing, not server-side.

## Code Audit Summary

### Critical (fix before launch)

1. **Weak NEXTAUTH_SECRET fallback** — `auth.ts` falls back to `'dev-only-fallback-secret'` if env var missing. Must fail startup in production instead.

2. **Guest checkout creates unverified users** — Stripe webhook upserts users by email without verification. Attacker can create accounts with victim's email.

3. **Stripe metadata trusts userEmail** — Storage upgrade handler reads `session.metadata.userEmail` without verifying it belongs to the authenticated user.

### High (fix this week)

4. **Email update has no uniqueness check** — `/api/settings` POST allows changing email to one already in use by another account.

5. **No email format validation** — Registration, settings, and forgot-password all accept emails without format validation.

6. **SIWE wallet address case sensitivity** — Lookup uses mixed case; could create duplicate accounts for same wallet.

7. **Bcrypt salt rounds inconsistent** — Registration uses 10 rounds, password change uses 12.

8. **Google OAuth auto-links without notification** — Silently links Gmail to existing email account.

### Medium (fix before launch day)

9. **Rate limiting in-memory only** — Falls back to Map if Redis unavailable; bypassable across multiple instances.

10. **CSRF available but not enforced** — Middleware exists but isn't mandatory on state-changing endpoints.

11. **Password minimum 6 chars** — Below NIST recommendation of 12.

12. **No Stripe webhook idempotency** — Duplicate webhook delivery could double-process subscription updates.

### Low / Info

13. Debug routes expose userCount (blocked in prod via proxy — acceptable).
14. No rate limiting on settings API.
15. 30-day session maxAge is generous but not dangerous.
16. Prisma singleton: correctly implemented.
17. Stripe lazy init: correctly implemented.

## Verdict
5 critical, 8 high, 9 medium, 8 low/info. The critical items (NEXTAUTH_SECRET fallback, guest checkout, Stripe metadata trust) should be fixed before any public launch.
