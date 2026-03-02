# Deployment Checklist

## 1. Update OpenClaw Version (Gordon)

File: `agentbot-backend/src/index.ts`

```bash
# Change these lines:
OPENCLAW_IMAGE = 'ghcr.io/openclaw/openclaw:2026.3.1'
OPENCLAW_RUNTIME_VERSION = '2026.3.1'
```

## 2. Fix Web Code (Gordon)

Fix Next.js 16 issues in `web/`:
- `app/lib/stripe.ts` - apiVersion + .cancel()
- `app/lib/privateMode.ts` - await headers()
- `app/api/webhooks/stripe/route.ts` - await headers()

## 3. Deploy

```bash
# Backend (Docker)
git push → Docker rebuilds

# Frontend (Vercel)
git push → Vercel auto-deploys
```

## 4. Test

- Check OpenClaw version: `curl agentbot.raveculture.xyz/api/openclaw-version`
- Check health: `curl agentbot.raveculture.xyz/api/health`
