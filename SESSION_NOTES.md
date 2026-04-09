# Agentbot Session Notes

## April 9, 2026 (Evening) — Security Patch, Skills Expansion, Smoke Test

### Checkpoint: `checkpoint-2026-04-09`
Branch: `checkpoint-2026-04-09` / Tag: `v2026.4.9-checkpoint`

**This is a known-good state. Both builds pass, npm audit clean, site smoke tested.**

### What Was Done

#### 1. Security — Zero Vulnerabilities
Patched 3 CVEs via root-level npm overrides in `package.json`:
- **hono <=4.12.11** → 4.12.12 (5 CVEs: cookie bypass, IPv4-mapped IPv6, path traversal, middleware bypass, setCookie validation)
- **@hono/node-server <1.19.13** → 1.19.13 (middleware bypass via repeated slashes)
- **defu <=6.1.4** → 6.1.7 (prototype pollution via `__proto__` key)

`npm audit fix` failed due to peer dependency conflicts (mppx/express5, wagmi/porto). Used workspace-level `npm update` after adding overrides.

**Result:** `npm audit` → 0 vulnerabilities on both web and backend.

#### 2. Skills — 6 New Skills Adapted from Kilo-Org/cloud
Adapted Cloudflare-native patterns to Agentbot's Docker/Vercel/Railway stack:

| Kilo Original | Agentbot Skill | What It Does |
|---------------|----------------|--------------|
| chat-sdk | `skills/chat-sdk.md` | Multi-platform bot SDK (Slack, Teams, Discord, GChat, GitHub, Linear) |
| durable-objects + do-sqlite-drizzle | `skills/stateful-agents.md` | Persistent state, agent bus, coordination, Drizzle SQLite migrations |
| sentry-cli | `skills/sentry-cli.md` | Production error monitoring, log streaming, AI root cause analysis |
| workers-best-practices | `skills/docker-containers.md` | Container best practices, resource limits, security checklist |
| workers-best-practices | `skills/code-review.md` | Code review against production anti-patterns |
| wrangler | `skills/deploy-cli.md` | CLI reference for agent deployment, secrets, logs |

All 6 registered in skill marketplace catalog (`web/app/api/skills/route.ts`). Will seed to DB on next Vercel deploy.

#### 3. Blog Post
- `web/app/blog/posts/security-patch-apr-9-2026/page.tsx` — Documents the CVE patches with links to advisories

#### 4. Smoke Test — Site Verified Clean
Full production smoke test of agentbot.raveculture.xyz:

| Category | Result |
|----------|--------|
| 30 pages tested | All 200 (dashboards 307 → login, correct) |
| /api/health | 200 `{status: ok, health: healthy}` |
| /api/skills | 200, 26 skills in DB |
| /api/agents | 200, returns agent list |
| Auth-gated routes | 401/403 (correct, fail-closed) |
| Console JS errors | 0 across 5 key pages |
| Blog posts | All existing posts 200 |

### Build Status
- `web` (Next.js): ✅ builds clean
- `agentbot-backend` (tsc): ✅ builds clean
- `npm audit`: ✅ 0 vulnerabilities

### Git State
- Branch: `main` at `1d546172`
- Pushed to origin
- 10 uncommitted files remain (5 `.omx` state files + 4 Solana/Bitcoin/Liquid dashboard changes + 1 doc)

### For Maintainers
- The npm overrides in root `package.json` are critical — they force patched versions of hono, @hono/node-server, and defu across all workspace transitive deps
- Skills are `.md` files in `skills/` with YAML frontmatter (name, description) — the format matches existing skills
- The skill marketplace seeds from `DEFAULT_SKILLS` array in `web/app/api/skills/route.ts` only when the Skill table is empty. To re-seed with new skills, you'd need to clear the table or add them via Prisma
- Blog post will 404 until Vercel redeploys from latest `main`

---

## March 19, 2026 - Open Source Prep Session

### Completed Tasks

#### 1. Clean Open Source Repository
- Created fresh repo: `github.com/Eskyee/agentbot-opensource`
- Zero commit history (no secret leak risk)
- 10 clean commits pushed

#### 2. Open Source Files Added
- README.md (with marketplace diagrams)
- CONTRIBUTING.md
- LICENSE (MIT)
- SECURITY.md
- CODE_OF_CONDUCT.md
- .env.example

#### 3. Claude Code Skills
16 skills for self-hosting and development:
- setup-agentbot
- add-telegram
- add-discord
- add-whatsapp
- debug-agentbot
- deploy-agentbot
- And more...

#### 4. Marketplace Agents Documentation
ASCII diagrams for:
- 4 Core Agents: THE-STRATEGIST, CREW-MANAGER, SOUND-SYSTEM, THE-DEVELOPER
- 6 Music Skills: Visual Synthesizer, Track Archaeologist, Setlist Oracle, Groupie Manager, Royalty Tracker, Demo Submitter
- 4 Event Skills: Event Ticketing, Event Scheduler, Venue Finder, Festival Finder

#### 5. Security Hardening (Red Team Audit)
Fixed critical vulnerabilities:
- Removed hardcoded secret fallbacks (auth.ts, wallet, api-keys, csrf)
- Production now throws errors if secrets missing
- JWT session reduced from 30 days → 24 hours
- Password complexity requirements (number + uppercase + symbol)
- Agent name length validation (max 100 chars)
- Input sanitization for limit/offset params

#### 6. Mintlify Docs Updated
- Pointed all GitHub links to opensource repo
- Updated index.mdx, installation.mdx, docs.json

#### 7. Blog Posts Added
- opensource-release (March 19, 2026)
- sponsor-us (March 19, 2026)
- Updated blog index

#### 8. Login Page
- Restored 🦞 lobster emoji
- Added Google sign-in option

---

### Repository Status

| Repo | URL | Commits | Status |
|------|-----|---------|--------|
| Original (Production) | github.com/Eskyee/agentbot | 874+ | Private |
| Open Source | github.com/Eskyee/agentbot-opensource | 10 | Public, Clean |

---

### Database
- PostgreSQL via Prisma ORM
- Neon serverless supported
- Supabase: Not integrated (never used)

---

### Security Audit Results
✅ No API keys in git history
✅ No secrets in current files
✅ .env.example is clean template
✅ No SQL injection risks
✅ Password complexity enforced
✅ JWT sessions shortened
✅ Input validation added

---

### Notes
- Dependabot found 10-12 vulnerabilities in dependencies (not code)
- Recommend: `npm audit fix` and keep dependencies updated
- All security fixes pushed to opensource repo

---

## April 6, 2026 - Railway OpenClaw Provision Fix

### Problem
Paying users couldn't deploy agents. Provisioned Railway containers returned 502.

### Root Causes Found & Fixed

#### 1. `gateway.bind: loopback` (the main bug)
OpenClaw gateway defaults to binding `127.0.0.1:18789`. Railway's reverse proxy is external and can't reach loopback → 502.

**Fix:** Inject a full `openclaw.json` config via env var + start command:
```
OPENCLAW_CONFIG_JSON = { gateway: { bind: 'lan', ... } }
startCommand = sh -c 'mkdir -p "$HOME/.openclaw" && printf "%s" "$OPENCLAW_CONFIG_JSON" > "$HOME/.openclaw/openclaw.json" && exec openclaw gateway'
```

#### 2. `channels.webchat` not valid in openclaw 2026.4.5
Config was crashing the container on every boot with: `channels.webchat: unknown channel id: webchat`

**Fix:** Removed `webchat` from channels config. Only `telegram`, `discord`, `whatsapp` are valid.

#### 3. `targetPort: 18789` missing from domain create
Railway proxy was defaulting to port 3000 instead of 18789.

**Fix:** Added `targetPort: 18789` to `serviceDomainCreate` mutation.

#### 4. Healthcheck path was wrong
Was set to `/api/status` — openclaw exposes `/health`.

**Fix:** `healthcheckPath: '/health'`

#### 5. `serviceInstanceUpdate` combining startCommand + resource limits → Railway rejection
Railway rejected the combined mutation. Separated into two calls — startCommand first (critical), limits second (non-fatal).

### Files Changed
- `agentbot-backend/src/routes/railway-provision.ts`
  - Added `buildOpenClawConfig()` function
  - `startCommand` via dedicated `serviceInstanceUpdate`
  - `targetPort: 18789` on domain create
  - Healthcheck: `/api/status` → `/health`
  - Removed `OPENCLAW_GATEWAY_BIND` env var (ineffective)

### Verified Live
```
GET https://agentbot-agent-1336825a8917885f-production.up.railway.app/health
→ 200 {"ok":true,"status":"live"}
```
