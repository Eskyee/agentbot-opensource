# Code Review

The previous senior code review (dated 2026-03-21) has been largely resolved by
the backend hardening work in the intervening weeks — body parsing, router
mounting, `timingSafeEqual` on the bearer token gate, rate limiting, metrics
auth, the full SSRF blocklist, `WALLET_ENCRYPTION_KEY` fail-hard, and the
metrics path-traversal sanitiser are all now in place.

The current review is delivered outside of git (shared with the team via the
Devin session attachment). A fresh on-repo review will land as a follow-up PR.

Guidance for future reviewers:
- Do NOT use historical CODE_REVIEW.md content to judge current state — always
  re-verify findings against `main` before filing them.
- Review priorities are documented in `AGENTS.md` → "Review Priorities".
- When a review finding is fixed, remove it from this file rather than marking
  it "resolved" — stale findings mislead the next reviewer.
