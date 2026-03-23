# Deployment Runbook

## Pre-Deployment Checklist

### 1. Verify Environment
```bash
# Run validation
node scripts/pre-deployment-validation.js
```

### 2. Secrets Configuration

#### Vercel (Frontend)
Required in Vercel dashboard → Settings → Environment Variables:

| Variable | Value | Status |
|----------|-------|--------|
| `DATABASE_URL` | Neon Postgres URL | ✅ Configured |
| `NEXTAUTH_SECRET` | `7a83b064a94d9e4b53fa0e2ad32259d52f4fcad72425641733b20d13b0228729` | ⚠️ Add this |
| `NEXTAUTH_URL` | `https://agentbot.raveculture.xyz` | ✅ Configured |
| `OPENROUTER_API_KEY` | Your OpenRouter key | ⚠️ Verify |
| `STRIPE_SECRET_KEY` | Stripe secret key | ⚠️ Add if using billing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ⚠️ Add if using Google auth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | ⚠️ Add if using Google auth |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ⚠️ Add if using GitHub auth |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | ⚠️ Add if using GitHub auth |

#### Render (Backend)
Required in Render dashboard → Environment:

| Variable | Value | Status |
|----------|-------|--------|
| `DATABASE_URL` | Neon Postgres URL | ✅ Configured |
| `OPENROUTER_API_KEY` | Your OpenRouter key | ⚠️ Verify |
| `ADMIN_EMAILS` | `djescaba@icloud.com` | ⚠️ Add |
| `STRIPE_SECRET_KEY` | Stripe secret key | ⚠️ Add if using billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ⚠️ Add if using billing |

### 3. Deploy

```bash
# Commit all changes
git add -A && git commit -m "chore: deployment readiness updates"

# Push to main (triggers auto-deploy)
git push origin main
```

### 4. Monitor Deployment

1. **GitHub Actions**: Check build passes → https://github.com/Eskyee/agentbot/actions
2. **Vercel**: Monitor deployment → https://vercel.com/dashboard
3. **Render**: Monitor deployment → https://dashboard.render.com

### 5. Verify Health

```bash
# Frontend health
curl -s https://agentbot.raveculture.xyz/api/health | jq .

# Backend health
curl -s https://agentbot-api.onrender.com/health | jq .

# Demo chat (test AI)
curl -s -X POST https://agentbot.raveculture.xyz/api/demo/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}' | jq .
```

---

## Rollback Procedure

### If Frontend (Vercel) has issues:
1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### If Backend (Render) has issues:
1. Go to Render dashboard → Service
2. Click "Events" tab
3. Find last successful deploy
4. Click "Redeploy"

### If Database issues:
1. Check Neon dashboard for connection issues
2. Run migrations manually: `npx prisma migrate deploy`
3. Verify tables exist: `npx prisma studio`

---

## Environment Variables Reference

### Critical (Required for startup)
- `DATABASE_URL` - Postgres connection string
- `NEXTAUTH_SECRET` - Auth session encryption
- `NEXTAUTH_URL` - Auth callback URL

### Important (Features won't work without these)
- `OPENROUTER_API_KEY` - AI model access
- `STRIPE_SECRET_KEY` - Billing
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `GITHUB_CLIENT_ID/SECRET` - GitHub OAuth

### Optional (Nice to have)
- `ADMIN_EMAILS` - Admin access
- `MUX_TOKEN_ID/SECRET` - Video streaming
- `BANKR_API_KEY` - Crypto operations
- `RESEND_API_KEY` - Email sending

---

## Troubleshooting

### App won't start
1. Check `DATABASE_URL` is set and correct
2. Verify `NEXTAUTH_SECRET` is set (Vercel)
3. Check logs for specific error

### Auth not working
1. Verify `NEXTAUTH_SECRET` matches on both platforms
2. Check `NEXTAUTH_URL` is correct
3. Verify OAuth client IDs/secrets

### AI features not working
1. Check `OPENROUTER_API_KEY` is set
2. Verify key has credits
3. Test with demo endpoint

### Billing not working
1. Check `STRIPE_SECRET_KEY` is set
2. Verify webhook secret matches
3. Check Stripe dashboard for webhook delivery

---

*Last updated: 2026-03-23*
