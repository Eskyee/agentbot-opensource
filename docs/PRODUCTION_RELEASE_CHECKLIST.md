# OpenClawDeploy Production Release Checklist

Use this checklist before every production release.

Automated pre-check command:

```bash
make prod-go-live-check
```

Automated report command (writes timestamped logs):

```bash
make prod-go-live-report
```

Reports are saved to:

- `runtime-data/release-reports/prod-go-live-YYYYMMDD-HHMMSS.log`
- `runtime-data/release-reports/latest.log`

Target domain:
- Frontend: `https://agentbot.raveculture.xyz`
- API: `https://api.agentbot.raveculture.xyz`
- Agents wildcard: `*.agents.agentbot.raveculture.xyz`

---

## 1) Pre-Flight

- [ ] Backend server is reachable and healthy
- [ ] PostgreSQL and Redis are healthy
- [ ] `INTERNAL_API_KEY` is generated and stored securely
- [ ] Stripe keys/price IDs are ready (if billing is enabled)
- [ ] TLS certificates are valid for API and wildcard agent domain

Quick checks:

```bash
curl -i https://api.agentbot.raveculture.xyz/health
```

---

## 2) Cloudflare DNS

- [ ] `CNAME agentbot -> cname.vercel-dns.com` (Proxy ON)
- [ ] `CNAME www -> cname.vercel-dns.com` (optional)
- [ ] `A api -> <SERVER_IP>` (Proxy OFF / DNS only)
- [ ] `A *.agents -> <SERVER_IP>` (Proxy OFF / DNS only)

---

## 3) Backend Production Env

Required backend values:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://...
REDIS_URL=redis://...
ALLOWED_ORIGINS=https://agentbot.raveculture.xyz,https://www.agentbot.raveculture.xyz
AGENTS_DOMAIN=agents.agentbot.raveculture.xyz
INTERNAL_API_KEY=<same-value-as-vercel>
```

- [ ] Restart backend + worker after env updates
- [ ] Confirm API still passes health checks

---

## 4) Vercel Project Setup (Root: `web`)

Set these Vercel env vars:

```env
NEXT_PUBLIC_APP_URL=https://agentbot.raveculture.xyz
BACKEND_API_URL=https://api.agentbot.raveculture.xyz
NEXT_PUBLIC_API_URL=https://api.agentbot.raveculture.xyz
NEXT_PUBLIC_AGENTS_DOMAIN=agents.agentbot.raveculture.xyz
INTERNAL_API_KEY=<same-value-as-backend>
```

Optional Stripe vars:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
```

- [ ] Add domain `agentbot.raveculture.xyz` in Vercel
- [ ] Trigger production redeploy

---

## 5) Smoke Test (Must Pass)

Frontend/API:

- [ ] `https://agentbot.raveculture.xyz` loads
- [ ] `https://agentbot.raveculture.xyz/api/health` returns `200`
- [ ] `https://api.agentbot.raveculture.xyz/health` returns `200`

Core product flow:

- [ ] Open `/signup` and `/onboard`
- [ ] Deploy one real test instance
- [ ] Open `/dashboard?id=<instance-id>`
- [ ] Run `start`, `stop`, `restart`, `update`
- [ ] Verify bot replies on Telegram/Discord/WhatsApp

Billing flow:

- [ ] `https://agentbot.raveculture.xyz/api/stripe/checkout?plan=starter` redirects to Stripe
- [ ] Success and cancel redirects land back on onboarding correctly

---

## 6) Trial/Billing Validation

- [ ] 3-day trial messaging appears on homepage/signup
- [ ] Deploy-first flow works without upfront payment
- [ ] Paid flow still works with checkout links
- [ ] (If implemented) trial-expiry enforcement works on day 4

---

## 7) Monitoring & Rollback

Monitoring:

- [ ] API logs show no repeated 5xx
- [ ] Worker logs are stable
- [ ] Container restarts are not flapping
- [ ] Stripe webhook failures are zero (if using webhooks)

Rollback:

- [ ] Previous backend image/tag is available
- [ ] Previous Vercel deployment is ready to promote
- [ ] DB backup exists for this release window

Quick commands:

```bash
docker ps
docker logs --tail=200 startclaw-api
docker logs --tail=200 startclaw-worker
```

---

## 8) Release Sign-Off

- [ ] Homepage and CTAs verified
- [ ] Signup, Marketplace, Docs, Terms, Privacy, Blog routes verified
- [ ] One successful end-to-end user journey recorded
- [ ] Release approved
