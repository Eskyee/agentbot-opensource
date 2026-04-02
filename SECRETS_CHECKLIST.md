# Secrets Checklist

> Warning
> This file previously included a literal secret value. It is now placeholder-only.
> Real values belong in dashboards, local untracked env files, or a password manager.
> For current platform ownership, read `docs/CURRENT_PLATFORM_STATE.md`.

## Generated Secrets

```
NEXTAUTH_SECRET=<generate-per-environment>
```

---

## Vercel Dashboard (https://vercel.com/dashboard → agentbot → Settings → Environment Variables)

### ✅ Already Configured (verify these exist)
- [ ] `DATABASE_URL` — Neon Postgres connection string
- [ ] `NEXTAUTH_URL` — `https://agentbot.raveculture.xyz`
- [ ] `OPENROUTER_API_KEY` — Your OpenRouter API key

### ⚠️ Add These Now
- [ ] `NEXTAUTH_SECRET` — Use a generated per-environment secret

### ⏳ Add When Ready (optional features)
- [ ] `GOOGLE_CLIENT_ID` — From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- [ ] `GITHUB_CLIENT_ID` — From GitHub Developer Settings
- [ ] `GITHUB_CLIENT_SECRET` — From GitHub Developer Settings
- [ ] `STRIPE_SECRET_KEY` — From Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` — From Stripe Webhooks

---

## Backend Dashboard

### ✅ Already Configured (verify these exist)
- [ ] `DATABASE_URL` — Same Neon Postgres connection string
- [ ] `OPENROUTER_API_KEY` — Same key as Vercel

### ⚠️ Add These Now
- [ ] `ADMIN_EMAILS` — Set in dashboard env vars, not in source

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

### 2. Redeploy or restart the active backend platform after env changes

### 3. Verify Health
```bash
curl -s https://agentbot.raveculture.xyz/api/health
curl -s https://agentbot-prod-production.up.railway.app/health
```

---

## Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Backend platform dashboard: verify against `docs/CURRENT_PLATFORM_STATE.md`
- Stripe Dashboard: https://dashboard.stripe.com
- Google Cloud Console: https://console.cloud.google.com
- GitHub Developer Settings: https://github.com/settings/developers
- OpenRouter Keys: https://openrouter.ai/keys

---

*Generated: 2026-03-23*
