# Changelog

All notable changes to Agentbot are documented here.

---

## [2026.4.1] — 2026-04-02

### Added
- **Passkeys** — WebAuthn passkey login via `webauthx`. No passwords required.
- **Skill Marketplace** — installable skills: instant-split, royalty-tracker, venue-finder, festival-finder, booking-settlement, demo-submitter, event-scheduler, event-ticketing, setlist-oracle, track-archaeologist, visual-synthesizer
- **Agent Personalities** — 5 music-industry system prompt profiles: basement, selector, A&R, road, label. Injected into every OpenClaw chat completion.
- **Free Trial** — 7-day trial on signup, no card required (`trialEndsAt` on User model)
- **Agent Showcase** — opt-in public showcase page. Agents can be discovered by the community.
- **Agent Bridge** — private A2A message bus (`bridge_messages`) for fleet coordination
- **Settings Tabs** — decomposed settings page: Profile, Security, Agents, API Keys, Referrals, Notifications
- **Factory Reset** — agents can be reset to clean state
- **Version Footer** — version + build info in dashboard footer
- **Status Tiles** — real-time status indicators on dashboard

### Fixed
- **Auto-pair** — dashboard and sidebar now always use the managed OpenClaw gateway URL. Stale per-container Railway URLs in the database can no longer override the correct gateway.
- **`/api/support/heal-token`** — route was missing (silently 404-ing on every heal attempt). Now exists and is auth-gated.
- **Skill route auth** — all 11 skill POST handlers were unauthenticated. Now require a valid session. `instant-split` (USDC transfers) was critical.
- **`/api/debug`** — was publicly accessible. Now admin-only.
- **Prompt sanitization** — visual-synthesizer strips control chars and caps prompt at 500 chars.
- **ID generation** — demo-submitter now uses `crypto.randomBytes()` instead of `Math.random()`.

### Security
- Auth guards added to all skill routes (ISC pattern: `getAuthSession()` fail-closed)
- `instant-split` USDC transfer endpoint now requires authenticated session
- `visual-synthesizer` prompt injection vector mitigated

---

## [2026.3.23] — 2026-03-30

### Added
- **Usage logs** — token usage, cost, latency tracked to `usage_logs` table
- **Agent Bridge messages** — `bridge_messages` schema for A2A coordination
- **Caddy integration** — programmatic subdomain routing for agents
- **SSRF blocklist** — IPv4 private + IPv6 ULA + mapped IPv4 + CGN ranges blocked
- **Ed25519 Discord verification** — webhook signature verification

### Fixed
- Backend tests stabilised in CI
- Scheduled workflow reliability improvements

---

## [2026.3.1] — 2026-03-01

### Added
- Initial public release
- Multi-tenant agent provisioning via Docker
- OpenClaw runtime integration
- USDC wallets per agent via Coinbase CDP
- A2A bus with SSRF protection
- OpenRouter BYOK model routing
- Stripe subscription billing
- Telegram + Discord + WhatsApp channel adapters
- Permission gate system (Safe / Dangerous / Destructive)
- Concurrent tool orchestration (`Promise.all` for read-only ops)

---

> Version numbers follow `YYYY.M.PATCH` format.
> For security disclosures see [SECURITY.md](./SECURITY.md).
