# AgentBot Stripe - Production Deployment Guide

**Status:** Ready for Live Deployment  
**Date:** February 25, 2025  
**Production URL:** https://agentbot.raveculture.xyz

---

## STEP 1: Gather Stripe Live Keys & Price IDs

You mentioned your Stripe live account is ready with 5 products. I need the following information to configure production:

### Required from Stripe Dashboard

Please provide:

1. **API Keys** (from https://dashboard.stripe.com/apikeys)
   - [ ] Secret Key: `sk_live_...`
   - [ ] Publishable Key: `pk_live_...`
   - [ ] Webhook Signing Secret: `whsec_...`

2. **Price IDs** (from https://dashboard.stripe.com/products)
   - [ ] Starter Plan Price ID: `price_...`
   - [ ] Pro Plan Price ID: `price_...`
   - [ ] Scale Plan Price ID: `price_...`
   - [ ] Enterprise Plan Price ID: `price_...`
   - [ ] White Glove Plan Price ID: `price_...`

### How to Find These

**API Keys:**
1. Go to https://dashboard.stripe.com/apikeys
2. Copy the "Secret key" (starts with `sk_live_`)
3. Copy the "Publishable key" (starts with `pk_live_`)

**Price IDs:**
1. Go to https://dashboard.stripe.com/products
2. Click each product
3. Find the price ID in the pricing section (starts with `price_`)

**Webhook Secret:**
1. Go to https://dashboard.stripe.com/webhooks
2. You'll create the webhook endpoint in Step 2

---

## STEP 2: Configure Webhook Endpoint

Once you have your keys, I'll need you to:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://agentbot.raveculture.xyz/api/stripe/webhook`
4. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`)

---

## STEP 3: Production Environment Variables

Once you provide the keys, I'll update:

```
.env.production
```

With:

```
# Stripe Live Keys (NOT test keys!)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Price IDs for 5 Plans
STRIPE_PRICE_STARTER=price_1HxxxStarter
STRIPE_PRICE_PRO=price_1HxxxPro
STRIPE_PRICE_SCALE=price_1HxxxScale
STRIPE_PRICE_ENTERPRISE=price_1HxxxEnterprise
STRIPE_PRICE_WHITEGLOVE=price_1HxxxWhiteGlove

# Other production vars
DATABASE_URL=postgresql://...
BACKEND_API_URL=https://api.agentbot.raveculture.xyz
INTERNAL_API_KEY=your-secret-key
RESEND_API_KEY=re_your_resend_key_if_using
```

---

## STEP 4: Deployment to Google Cloud

Once environment variables are set, deployment steps:

```bash
# 1. SSH into production server
ssh -i your-key.pem user@your-server-ip

# 2. Clone/pull latest code
cd agentbot
git pull origin main

# 3. Copy production env
cp .env.production .env

# 4. Update docker-compose with production vars
docker compose up -d

# 5. Verify services running
docker ps
docker logs agentbot-frontend -f
docker logs agentbot-api -f
```

---

## STEP 5: Verify Production is Live

Once deployed, verify:

```bash
# Check frontend
curl https://agentbot.raveculture.xyz/pricing
# Should return HTML pricing page

# Check backend health
curl https://api.agentbot.raveculture.xyz/health
# Should return: {"status":"ok"}

# Check webhook endpoint
curl -X POST https://agentbot.raveculture.xyz/api/stripe/webhook
# Should return 400 (missing signature, which is expected for curl test)
```

---

## STEP 6: Test Live Payment

1. Visit https://agentbot.raveculture.xyz/pricing
2. Click "Get Started" on any plan
3. Use a **REAL TEST CARD** (Stripe now requires real card details even for test):
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/26)
   - CVC: Any 3 digits
4. Complete payment
5. Verify:
   - ✓ Success page displays
   - ✓ Database has user with correct plan
   - ✓ Email received (if configured)
   - ✓ Deployment triggered
   - ✓ Agent appears in dashboard

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Stripe account created ✓
- [ ] 5 products created ✓
- [ ] API keys obtained
- [ ] Price IDs obtained
- [ ] Webhook endpoint URL ready: https://agentbot.raveculture.xyz/api/stripe/webhook
- [ ] Code reviewed and tested ✓

### Deployment
- [ ] .env.production updated with live keys
- [ ] Database migrated (already done)
- [ ] Docker services built
- [ ] Services deployed to production server
- [ ] Health checks passing
- [ ] Logs showing no errors

### Post-Deployment Verification
- [ ] Pricing page loads
- [ ] Checkout process works
- [ ] Webhooks being received
- [ ] Database updates working
- [ ] Deployments triggering
- [ ] Emails sending (if provider configured)

### Monitoring
- [ ] Watch webhook logs for errors
- [ ] Monitor payment success rate
- [ ] Track deployment completion times
- [ ] Alert on failed payments
- [ ] Track customer signups

---

## What You Need to Provide

Please share:

1. **Stripe Live Secret Key**
2. **Stripe Live Publishable Key**
3. **5 Price IDs** (one for each plan)
4. **Production Server Details**:
   - IP address or domain
   - SSH key location
   - Ubuntu/Debian version
   - Installed: Docker, Docker Compose, Node.js, PostgreSQL

---

## Timeline

- **Now:** You provide Stripe keys
- **5 min:** I update configuration
- **10 min:** Webhook configured in Stripe
- **15 min:** Deploy to production
- **5 min:** Run smoke tests
- **Total: ~35 minutes to production**

---

## Support

If anything goes wrong:

1. Check logs: `docker logs agentbot-frontend -f`
2. Check database: `psql $DATABASE_URL`
3. Check Stripe webhooks: https://dashboard.stripe.com/webhooks/logs
4. Test webhook manually: `stripe trigger checkout.session.completed --api-key sk_live_...`

---

**Ready when you are! Just provide the Stripe keys and server details.** 🚀
