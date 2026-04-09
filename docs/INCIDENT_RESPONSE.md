# Incident Response And Rollback Runbook

Last updated: 2026-04-03

This is the current production incident runbook for Agentbot. Use this file before older mixed-era rollback docs.

## Production Targets

- Canonical web domain: `https://agentbot.sh`
- Vercel project: `raveculture-projects/agentbot`
- Vercel root directory: `web`
- Railway backend health: `https://agentbot-backend-production.up.railway.app/health`
- Borg dashboard: `https://borg-0-production.up.railway.app/dashboard`

## Severity Levels

- `SEV-1`: Full production outage, login broken, payments broken, dashboard unusable
- `SEV-2`: Major feature degraded, partial dashboard failure, broken onboarding or chat
- `SEV-3`: Non-critical issue with workaround

## Immediate Response

1. Confirm scope.
   - Check `https://agentbot.sh/api/health`
   - Check Railway backend health
   - Check current Vercel production deployment id
2. Freeze risky changes.
   - Stop merging unrelated PRs
   - Do not rotate secrets unless the incident requires it
3. Decide whether to rollback or hotfix.
   - Roll back for `SEV-1` and clear regressions introduced by the latest deployment
   - Hotfix only if the blast radius is narrow and the repair is low risk

## Communications

- Primary ops channel: maintain one shared incident thread in the team channel
- Status updates cadence:
  - `SEV-1`: every 15 minutes
  - `SEV-2`: every 30 minutes
- Always record:
  - first detected time
  - affected surface
  - current mitigation
  - next checkpoint

## Vercel Rollback

### Preferred: Promote Last Known Good Deployment

1. Open Vercel dashboard for `agentbot`
2. Go to `Deployments`
3. Find the last known good deployment before the regression
4. Click `Promote to Production`
5. Re-check:
   - `https://agentbot.sh`
   - `https://agentbot.sh/api/health`
   - affected dashboard route

### Git-Based Rollback

```bash
git -C /Users/raveculture/agentbot log --oneline -10
git -C /Users/raveculture/agentbot revert <bad_commit_sha>
git -C /Users/raveculture/agentbot push origin main
```

Use `git revert`, not history rewrite, for production rollback.

## Railway Rollback

1. Open the affected Railway service deployment history
2. Redeploy the previous healthy release
3. Verify the health endpoint before closing the incident

## Verification Checklist

- Homepage loads on `https://agentbot.sh`
- `GET /api/health` returns `200`
- Login page loads
- `/dashboard/fleet` redirects correctly or loads for authenticated users
- `/dashboard/colony` no longer returns `503`
- `/api/chat` and `/api/provision` return expected auth or success responses

## Aftercare

- Record the root cause
- Link the bad deployment id and the rollback deployment id
- List customer-visible impact
- Create a follow-up issue for any temporary mitigation
