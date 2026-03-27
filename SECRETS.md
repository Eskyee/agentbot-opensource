# Secrets Configuration Guide

## Quick Reference

### Generated Secrets (Use These)

```
NEXTAUTH_SECRET=7a83b064a94d9e4b53fa0e2ad32259d52f4fcad72425641733b20d13b0228729
JWT_SECRET=R63NBQE+yJsSvS2Ky0yFq+pQnWpqmTPPDJSyV9HJebU=
INTERNAL_API_KEY=80f679917f665977d0c1950c
WALLET_ENCRYPTION_KEY=33cd60d7755d60c4242a10c61d58df66
```

---

## Vercel Dashboard Configuration

**URL**: https://vercel.com/dashboard → agentbot → Settings → Environment Variables

### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_q0ykQXiZa9BJ@ep-cold-dawn-amxvs08u-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | Neon Postgres |
| `NEXTAUTH_SECRET` | `7a83b064a94d9e4b53fa0e2ad32259d52f4fcad72425641733b20d13b0228729` | Generated above |
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

## Render Dashboard Configuration

**URL**: https://dashboard.render.com → agentbot-api → Environment

### Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Same Neon URL as Vercel | Same database |
| `OPENROUTER_API_KEY` | Same key as Vercel | Same provider |
| `ADMIN_EMAILS` | `YOUR_ADMIN_EMAIL_5` | Admin access |

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

### After adding secrets to Render:
- Render auto-redeploys when env vars change
- Check deploy logs for errors

### Test health endpoints:
```bash
# Frontend
curl -s https://agentbot.raveculture.xyz/api/health

# Backend
curl -s https://agentbot-api.onrender.com/health
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
