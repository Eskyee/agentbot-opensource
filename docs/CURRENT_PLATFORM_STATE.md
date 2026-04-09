# Current Platform State

Last verified: 2026-04-05

This file is the current operational reference for platform ownership, deployment targets, and verification status. When other docs disagree, treat this file as the source of truth until they are updated.

## Verified Live Platforms

- Web app:
  - Platform: Vercel
  - Project: `raveculture-projects/agentbot`
  - Root directory: `web`
  - Production URL: `https://agentbot.sh`
- Backend control plane:
  - Platform: Railway
  - Project: `motivated-comfort`
  - Environment: `production`
  - Service: `agentbot-backend`
  - Health URL: `https://agentbot-backend-production.up.railway.app/health`
- Borg soul:
  - Platform: Railway
  - Project: `x402-gw-v2`
  - Service: `tempo-x402+Borg`
  - App URL: `https://borg-0-production.up.railway.app`
  - Dashboard URL: `https://borg-0-production.up.railway.app/dashboard`
  - Health URL: `https://borg-0-production.up.railway.app/health`
- x402 gateway:
  - Platform: Railway
  - Service URL: `https://x402-gateway-production.up.railway.app`
  - Health URL: `https://x402-gateway-production.up.railway.app/health`
- OpenClaw managed runtime:
  - Platform: Railway
  - Project: `motivated-comfort`
  - Service: `OpenClaw 🦞`
  - Service URL: `https://openclaw-production-a09d.up.railway.app`
  - Status URL: `https://openclaw-production-a09d.up.railway.app/api/status`
- Ollama:
  - Platform: Railway
  - Project: `motivated-comfort`
  - Service: `Ollama`
- Bitcoin / NBXplorer:
  - Platform: Railway
  - Project: `motivated-comfort`
  - Services: `bitcoind-mainnet`, `bitcoin-backend-mainnet`, `Postgres`
  - Health URL: `https://bitcoin-backend-mainnet-production.up.railway.app/health`
- GitHub repos:
  - Private production repo: `Eskyee/agentbot`
  - Public mirror: `Eskyee/agentbot-opensource`

## Verified Health

**⚠️ Historical note:** older docs referenced `tempo-x402-production.up.railway.app`, `agentbot-prod-production.up.railway.app`, and `openclaw-gw-ui-production.up.railway.app`. Those are no longer the current production control-plane targets.

- Vercel production responded `HTTP 200` on 2026-04-04.
- Agentbot backend health responded `HTTP 200` on 2026-04-04.
- OpenClaw status responded `running: true` on 2026-04-04.
- `OPENCLAW_VERSION` on Railway was set to `latest` on 2026-04-04.
- x402 gateway health is still expected at `https://x402-gateway-production.up.railway.app/health`.
- Bitcoin / NBXplorer now points at the mainnet stack on Railway as of 2026-04-05.
- `agentbot-backend` now reads `BTC_BACKEND_NBXPLORER_URL=https://bitcoin-backend-mainnet-production.up.railway.app`.
- The older testnet services (`bitcoind`, `bitcoin-backend`) were taken down and now have `NO DEPLOYMENT` in Railway.

## Dashboard Status Notes (2026-04-04)

- Fleet dashboard data is sourced from `/api/mission-control/fleet/graph`.
- Colony dashboard data is sourced from `/api/colony/status?action=tree`.
- The displayed Borg dashboard link should be `https://borg-0-production.up.railway.app/dashboard`.
- The soul service feed URL may differ from the displayed Borg dashboard URL; do not infer the dashboard link by appending `/dashboard` to the service feed.
- Managed runtime provisioning now queues backend jobs instead of doing all Railway work inline in the web request path.
- Local production build for `web/` was verified with `npm run build` on 2026-04-04 after queue, onboarding, MCP, and runtime-status changes.

## Deployment Rules

- Treat `web/` as the app root for Vercel.
- Follow the staged release process in `docs/deploy-workflow.md`.
- Follow `docs/RAILWAY_PROTECTION_RUNBOOK.md` before making Railway production changes in `motivated-comfort`.
- Do not assume older Render references are current without verification.

## Documentation Status

The following docs contain stale or mixed-era infra guidance and should be treated carefully:

- `DEPLOYMENT.md`
- `SAFETY_PROCEDURES.md`
- `ROLLBACK.md`
- `API_GUIDE.md`
- `SECRETS.md`
- `SECRETS_CHECKLIST.md`

## Sensitive Data Policy

- Never store live secrets in markdown files.
- Keep real values in dashboard env vars, local untracked env files, or a password manager.
- Use placeholders in repo docs.

## OpenClaw Gateway Lockdown (2026-04-04)

- The gateway now binds `controlUi.allowedOrigins` to the canonical web origin via the `CONTROL_UI_ORIGIN` env var instead of `*`. Use `https://agentbot.sh` as the primary dashboard origin and keep the old alias only as an explicit compatibility allowlist entry if needed.
- Device auth is re-enabled and `dangerouslyAllowHostHeaderOriginFallback` is disabled to close the DNS-rebinding attack vector the previous config exposed.
- The `gateway/openclaw.json` file is now written with `chmod 600` and the workspace directory uses `chmod 700` so the non-root `node` user is the only one who can read configuration or secrets.
- A new readiness helper in `gateway/entrypoint.sh` waits for `${AGENTBOT_API_URL}/health` (configurable via `SERVICE_HEALTH_URL`) before launching `openclaw gateway`. Set `SKIP_SERVICE_READINESS=true` to skip the wait during emergency restarts.
- The current managed runtime host is `https://openclaw-production-a09d.up.railway.app`. Prefer explicit environment overrides for control UI routing and avoid reintroducing old `openclaw-gw-ui-production` defaults.
