---
task: Verify all shipped features work end-to-end
slug: 20260402-verify-all-shipped
effort: advanced
phase: observe
progress: 0/32
mode: interactive
started: 2026-04-02T00:00:00Z
updated: 2026-04-02T00:00:00Z
---

## Context
User shipped 80+ commits since last session. Need to verify all features work:
passkeys, marketplace agents, factory reset, trial banner, showcase, settings tabs,
agent bridge, skills, webauthx, version footer, status tiles.

## Criteria

### Build & Deploy
- [ ] ISC-1: Vercel latest deployment status is ready/success
- [ ] ISC-2: No TypeScript errors in key changed files
- [ ] ISC-3: No missing imports or broken module references

### Passkey Auth
- [ ] ISC-4: PasskeyCredential model exists in Prisma schema
- [ ] ISC-5: PasskeyChallenge model exists in Prisma schema
- [ ] ISC-6: webauthx dependency installed in package.json
- [ ] ISC-7: /api/passkey/* routes exist and are auth-gated

### Free Trial
- [ ] ISC-8: trialEndsAt field on User model
- [ ] ISC-9: Register route sets trialEndsAt = now + 7 days
- [ ] ISC-10: TrialBanner component exists and fetches /api/trial
- [ ] ISC-11: TrialBanner rendered in dashboard layout

### Marketplace Agents
- [ ] ISC-12: 4 marketplace agents defined with name/role/description/skills
- [ ] ISC-13: Provision route accepts template config
- [ ] ISC-14: At least one skill API route returns non-mock data

### Settings Tabs
- [ ] ISC-15: Settings page imports from ./tabs
- [ ] ISC-16: ProfileTab, SecurityTab, AgentsTab, ReferralsTab all exist
- [ ] ISC-17: Showcase toggle in AgentsTab section

### Factory Reset
- [ ] ISC-18: POST /api/openclaw/maintenance accepts action=factory-reset
- [ ] ISC-19: factory-reset calls backend update with KNOWN_GOOD_IMAGE

### Showcase
- [ ] ISC-20: /showcase page exists with agent grid
- [ ] ISC-21: /api/showcase returns opted-in running agents
- [ ] ISC-22: /api/agents/showcase PATCH updates showcaseOptIn

### Version Footer / Status
- [ ] ISC-23: Footer shows OpenClaw version from API
- [ ] ISC-24: /api/dashboard/health route exists
- [ ] ISC-25: Status tiles render in dashboard

### Skills
- [ ] ISC-26: instant-split skill route exists
- [ ] ISC-27: venue-finder skill route exists
- [ ] ISC-28: royalty-tracker skill route exists

### Security
- [ ] ISC-29: /api/debug route has admin auth guard
- [ ] ISC-30: All 4 debug routes return 404 for non-admin

### Critical Anti-Criteria
- [ ] ISC-A1: No hardcoded localhost URLs in production routes
- [ ] ISC-A2: No unprotected routes returning sensitive data
