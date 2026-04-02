# Secrets Configuration Guide

> Warning
> This file previously contained live secret material and concrete infrastructure values.
> It is now placeholder-only. Keep real values in dashboard env vars, local untracked env files, or a password manager.
> For current platform ownership, read `docs/CURRENT_PLATFORM_STATE.md`.

## Quick Reference

### Generated Secrets

Generate unique values per environment. Do not commit the real outputs.

```
NEXTAUTH_SECRET=<generate-per-environment>
JWT_SECRET=<generate-per-environment>
INTERNAL_API_KEY=<generate-per-environment>
WALLET_ENCRYPTION_KEY=<generate-per-environment>
```

---

## Vercel Dashboard Configuration

**URL**: https://vercel.com/dashboard → agentbot → Settings → Environment Variables

### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `<production database url>` | Keep only in dashboard or local env |
| `NEXTAUTH_SECRET` | `<generated secret>` | Generate separately for each environment |
| `NEXTAUTH_URL` | `https://agentbot.raveculture.xyz` | Production URL |
| `OPENROUTER_API_KEY` | Your key from openrouter.ai | Get from https://openrouter.ai/keys |

### OAuth Providers (if using)

1. **Google OAuth**:
   - Go to https://console.cloud.google.com/
   - Create project → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `https://agentbot.raveculture.xyz/api/auth/callback/google`
   - Copy Client ID and Secret

2. **GitHub OAuth**:
   - Go to https://github.com/settings/developers
   - New OAuth App
   - Homepage: `https://agentbot.raveculture.xyz`
   - Callback: `https://agentbot.raveculture.xyz/api/auth/callback/github`
   - Copy Client ID and Secret

### Optional Variables

| Variable | Where to Get |
|----------|--------------|
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | https://dashboard.stripe.com/webhooks |
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `GOOGLE_CLIENT_ID/SECRET` | Google Cloud Console |
| `GITHUB_CLIENT_ID/SECRET` | GitHub Developer Settings |

---

## Backend Dashboard Configuration

Verify the active backend platform in `docs/CURRENT_PLATFORM_STATE.md` before applying these variables.

### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Same production database URL as web | Keep only in dashboard or local env |
| `OPENROUTER_API_KEY` | Same key as Vercel | Same provider |
| `ADMIN_EMAILS` | `<comma-separated admin emails>` | Configure in env, not in source |

### Optional Variables

| Variable | Notes |
|----------|-------|
| `STRIPE_SECRET_KEY` | If using billing |
| `STRIPE_WEBHOOK_SECRET` | If using billing |
| `CDP_API_KEY_NAME` | Coinbase CDP (if using crypto) |
| `CDP_API_KEY_PRIVATE_KEY` | Coinbase CDP (if using crypto) |
| `BANKR_API_KEY` | Bankr integration |
| `MUX_TOKEN_ID` | Mux video streaming |
| `MUX_TOKEN_SECRET` | Mux video streaming |

---

## Verification Steps

### After adding secrets to Vercel:
```bash
# Redeploy to pick up new env vars
vercel --prod --yes
```

### After adding secrets to the backend platform:
- Redeploy or restart the backend service as required by the active platform
- Check deploy logs for errors

### Test health endpoints:
```bash
# Frontend
curl -s https://agentbot.raveculture.xyz/api/health

# Backend
curl -s https://agentbot-prod-production.up.railway.app/health
```

---

## Security Notes

- Never commit secrets to git
- Use different secrets for staging vs production
- Rotate secrets periodically
- Use environment-specific values (Vercel has Preview vs Production)
- Store backups in a password manager

---

*Generated: 2026-03-23*
