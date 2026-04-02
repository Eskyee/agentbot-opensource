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
- GitHub repos:
  - Private production repo: `Eskyee/agentbot`
  - Public mirror: `Eskyee/agentbot-opensource`

## Verified Health

- Vercel production responded `HTTP 200` on 2026-04-02.
- Railway backend health responded `HTTP 200` on 2026-04-02.

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
