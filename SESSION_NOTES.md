# Agentbot Session Notes

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
