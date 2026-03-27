# Secrets Checklist

## Generated Secrets (Copy These Now!)

```
NEXTAUTH_SECRET=7a83b064a94d9e4b53fa0e2ad32259d52f4fcad72425641733b20d13b0228729
```

---

## Vercel Dashboard (https://vercel.com/dashboard → agentbot → Settings → Environment Variables)

### ✅ Already Configured (verify these exist)
- [ ] `DATABASE_URL` — Neon Postgres connection string
- [ ] `NEXTAUTH_URL` — `https://agentbot.raveculture.xyz`
- [ ] `OPENROUTER_API_KEY` — Your OpenRouter API key

### ⚠️ Add These Now
- [ ] `NEXTAUTH_SECRET` — Use: `7a83b064a94d9e4b53fa0e2ad32259d52f4fcad72425641733b20d13b0228729`

### ⏳ Add When Ready (optional features)
- [ ] `GOOGLE_CLIENT_ID` — From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- [ ] `GITHUB_CLIENT_ID` — From GitHub Developer Settings
- [ ] `GITHUB_CLIENT_SECRET` — From GitHub Developer Settings
- [ ] `STRIPE_SECRET_KEY` — From Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` — From Stripe Webhooks

---

## Render Dashboard (https://dashboard.render.com → agentbot-api → Environment)

### ✅ Already Configured (verify these exist)
- [ ] `DATABASE_URL` — Same Neon Postgres connection string
- [ ] `OPENROUTER_API_KEY` — Same key as Vercel

### ⚠️ Add These Now
- [ ] `ADMIN_EMAILS` — `YOUR_ADMIN_EMAIL_5`

### ⏳ Add When Ready (optional features)
- [ ] `STRIPE_SECRET_KEY` — Same as Vercel
- [ ] `STRIPE_WEBHOOK_SECRET` — From Stripe Webhooks
- [ ] `CDP_API_KEY_NAME` — Coinbase CDP (crypto features)
- [ ] `CDP_API_KEY_PRIVATE_KEY` — Coinbase CDP (crypto features)
- [ ] `BANKR_API_KEY` — Bankr integration
- [ ] `MUX_TOKEN_ID` — Mux video streaming
- [ ] `MUX_TOKEN_SECRET` — Mux video streaming

---

## After Adding Secrets

### 1. Redeploy Vercel
```bash
vercel --prod --yes
```

### 2. Render auto-redeploys when env vars change

### 3. Verify Health
```bash
curl -s https://agentbot.raveculture.xyz/api/health
curl -s https://agentbot-api.onrender.com/health
```

---

## Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Render Dashboard: https://dashboard.render.com
- Stripe Dashboard: https://dashboard.stripe.com
- Google Cloud Console: https://console.cloud.google.com
- GitHub Developer Settings: https://github.com/settings/developers
- OpenRouter Keys: https://openrouter.ai/keys

---

*Generated: 2026-03-23*
