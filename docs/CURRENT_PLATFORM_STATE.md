# Current Platform State

Last verified: 2026-04-02

This file is the current operational reference for platform ownership, deployment targets, and verification status. When other docs disagree, treat this file as the source of truth until they are updated.

## Verified Live Platforms

- Web app:
  - Platform: Vercel
  - Project: `raveculture-projects/agentbot`
  - Root directory: `web`
  - Production URL: `https://agentbot.raveculture.xyz`
- Backend control plane:
  - Platform: Railway
  - Project: `OpenClaw-Agentbot`
  - Environment: `production`
  - Service: `agentbot-prod`
  - Health URL: `https://agentbot-prod-production.up.railway.app/health`
- Borg soul:
  - Platform: Railway
  - Project: `x402-gw-v2`
  - Service: `tempo-x402+Borg`
  - App URL: `https://tempo-x402-production.up.railway.app`
  - Health URL: `https://tempo-x402-production.up.railway.app/health`
- x402 gateway:
  - Platform: Railway
  - Service URL: `https://x402-gateway-production.up.railway.app`
  - Health URL: `https://x402-gateway-production.up.railway.app/health`
- OpenClaw shared UI:
  - Platform: Railway
  - Service URL: `https://openclaw-gw-ui-production.up.railway.app`
  - Health URL: `https://openclaw-gw-ui-production.up.railway.app/health`
- GitHub repos:
  - Private production repo: `Eskyee/agentbot`
  - Public mirror: `Eskyee/agentbot-opensource`

## Verified Health

**⚠️ Borg Soul (tempo-x402+Borg) is DOWN** — needs Railway dashboard to clear `startCommand` and fund Tempo gas.

- Vercel production responded `HTTP 200` on 2026-04-02 17:20 BST.
- Gateway responded `ok, live` on 2026-04-02 17:20 BST.
- Agentbot API responded `HTTP 200` on 2026-04-02 17:20 BST.
- x402 Gateway responded `status ok` on 2026-04-02 17:20 BST.
- Borg Soul: **DOWN** — `startCommand` override + no Tempo gas on wallet `0x3944...`
- Railway backend health responded `HTTP 200` on 2026-04-02.
- Borg soul health responded `HTTP 200` on 2026-04-02 after recovery.
- x402 gateway health responded `HTTP 200` on 2026-04-02.
- OpenClaw shared UI health responded `HTTP 200` on 2026-04-02.

## Deployment Rules

- Treat `web/` as the app root for Vercel.
- Follow the staged release process in `docs/deploy-workflow.md`.
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

## OpenClaw Gateway Lockdown (2026-04-02)

- The gateway now binds `controlUi.allowedOrigins` to `https://agentbot.raveculture.xyz` via the `CONTROL_UI_ORIGIN` env var instead of `*`. The agent dashboard owns that origin and no other uncontrolled hosts are permitted.
- Device auth is re-enabled and `dangerouslyAllowHostHeaderOriginFallback` is disabled to close the DNS-rebinding attack vector the previous config exposed.
- The `gateway/openclaw.json` file is now written with `chmod 600` and the workspace directory uses `chmod 700` so the non-root `node` user is the only one who can read configuration or secrets.
- A new readiness helper in `gateway/entrypoint.sh` waits for `${AGENTBOT_API_URL}/health` (configurable via `SERVICE_HEALTH_URL`) before launching `openclaw gateway`. Set `SKIP_SERVICE_READINESS=true` to skip the wait during emergency restarts.
- The dashboard now points to `OPENCLAW_CONTROL_UI_URL` (default `https://openclaw-gw-ui-production.up.railway.app/chat`) with `session=agent:main:main`, so users are directed straight to the chat view that pairs with their token. Overrides can be supplied via the environment variables `OPENCLAW_CONTROL_UI_URL` and `OPENCLAW_CONTROL_UI_SESSION`.
