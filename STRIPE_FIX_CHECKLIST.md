# AgentBot Stripe Integration - Fix Checklist

> **Status:** 🚫 NOT PRODUCTION READY  
> **Critical Issues:** 5  
> **Est. Fix Time:** 7-8 hours  
> **Last Updated:** February 24, 2025

---

## PHASE 1: CRITICAL FIXES (Do First - 3.25 hours)

### [ ] Critical Fix #1: Webhook Signature Verification (30 min)
- **File:** `web/app/api/stripe/webhook/route.ts`
- **Status:** ⛔ BROKEN - Wrong algorithm
- **Impact:** All webhooks will be rejected
- **Checklist:**
  - [ ] Replace crypto.createHmac with Stripe.webhooks.constructEvent()
  - [ ] Test with Stripe CLI locally
  - [ ] Verify webhook events are now received
  - **Code ref:** See STRIPE_STATUS_SUMMARY.md Step 1

### [ ] Critical Fix #2: Create Success Page (30 min)
- **File:** `web/app/checkout/success/page.tsx` (NEW)
- **Status:** ❌ MISSING
- **Impact:** User sees no payment confirmation
- **Checklist:**
  - [ ] Create file with React component
  - [ ] Add payment verification logic
  - [ ] Display plan name and confirmation
  - [ ] Add "Go to Dashboard" button
  - **Code ref:** See STRIPE_STATUS_SUMMARY.md Step 2

### [ ] Critical Fix #3: Create Email Service (1 hour)
- **File:** `web/app/lib/email.ts` (NEW)
- **Status:** ❌ MISSING
- **Impact:** Webhooks crash when sending emails
- **Checklist:**
  - [ ] Create file with sendEmail() function
  - [ ] Add sendPaymentReceiptEmail() function
  - [ ] Configure SMTP or email provider
  - [ ] Test email sending locally
  - [ ] Install nodemailer: `npm install nodemailer @types/nodemailer`
  - **Code ref:** See STRIPE_STATUS_SUMMARY.md Step 5

### [ ] Critical Fix #4: Update Database Schema (30 min)
- **File:** `prisma/schema.prisma`
- **Status:** ⚠️ INCOMPLETE
- **Impact:** Missing subscription tracking fields
- **Checklist:**
  - [ ] Add stripeCustomerId field
  - [ ] Add stripeSubscriptionId field
  - [ ] Add subscriptionStatus field
  - [ ] Add subscriptionStartDate field
  - [ ] Add subscriptionEndDate field
  - [ ] Create WebhookEvent model for idempotency
  - [ ] Run migration: `npx prisma migrate dev --name add_stripe_fields`
  - [ ] Generate Prisma client: `npx prisma generate`
  - **Code ref:** See STRIPE_STATUS_SUMMARY.md Step 4

### [ ] Critical Fix #5: Add Deployment Trigger (45 min)
- **File:** `web/app/api/stripe/webhook/route.ts`
- **Status:** ❌ MISSING trigger code
- **Impact:** Users pay but services never deploy
- **Checklist:**
  - [ ] Add fetch call to backend `/api/subscriptions/deploy`
  - [ ] Include userId, plan, and email in body
  - [ ] Add error handling for deployment failures
  - [ ] Log deployment results
  - [ ] Test deployment is triggered on payment
  - **Code ref:** See STRIPE_STATUS_SUMMARY.md Step 4

**Subtotal Phase 1: 3.25 hours**

---

## PHASE 2: PRODUCTION READY (4-5 hours)

### [ ] High Priority #1: Create Deployment Endpoint (1 hour)
- **File:** `agentbot-backend/src/subscriptions.ts` (NEW)
- **Status:** ❌ MISSING
- **Checklist:**
  - [ ] Create new route handler
  - [ ] Add POST /api/subscriptions/deploy endpoint
  - [ ] Authenticate with INTERNAL_API_KEY
  - [ ] Validate userId and plan parameters
  - [ ] Call existing /api/deployments endpoint
  - [ ] Return deployment result to webhook
  - **Code ref:** See STRIPE_STATUS_SUMMARY.md Step 7

### [ ] High Priority #2: Add Rate Limiting (30 min)
- **File:** `web/app/api/stripe/checkout/route.ts`
- **Status:** ❌ MISSING
- **Checklist:**
  - [ ] Add Redis rate limiting
  - [ ] Limit to 5 requests per minute per IP
  - [ ] Return 429 when exceeded
  - [ ] Install: `npm install @upstash/redis`
  - **Code ref:** See STRIPE_INTEGRATION_CODE_REVIEW.md Section 2.3

### [ ] High Priority #3: Fix Hardcoded Prices (30 min)
- **File:** `web/app/api/stripe/checkout/route.ts`
- **Status:** ⚠️ Using amounts instead of Price IDs
- **Checklist:**
  - [ ] Replace hardcoded PLAN_PRICES with Price IDs
  - [ ] Read STRIPE_PRICE_STARTER from env
  - [ ] Read all 5 price IDs from env
  - [ ] Use Stripe Price ID in checkout session
  - [ ] Add env var validation
  - **Code ref:** See STRIPE_INTEGRATION_CODE_REVIEW.md Section 1.4

### [ ] High Priority #4: Add Webhook Idempotency (1 hour)
- **File:** `web/app/api/stripe/webhook/route.ts`
- **Status:** ❌ MISSING
- **Impact:** Could charge user twice
- **Checklist:**
  - [ ] Create WebhookEvent table migration (done in Phase 1)
  - [ ] Check if event already processed at start
  - [ ] Skip if duplicate, return 200
  - [ ] Record eventId after processing
  - [ ] Test with webhook replay
  - **Code ref:** See STRIPE_INTEGRATION_CODE_REVIEW.md Section 1.5

### [ ] High Priority #5: Create Verification Endpoint (20 min)
- **File:** `web/app/api/stripe/verify-session/route.ts` (NEW)
- **Status:** ❌ MISSING (for success page)
- **Checklist:**
  - [ ] Create GET endpoint
  - [ ] Accept session_id parameter
  - [ ] Query Stripe API for session
  - [ ] Return plan and status
  - [ ] Handle errors gracefully
  - **Code ref:** See STRIPE_STATUS_SUMMARY.md Step 2

**Subtotal Phase 2: ~3 hours**

---

## PHASE 3: TESTING & LAUNCH (3.5 hours)

### [ ] Test: Local Smoke Test (1 hour)
- **Checklist:**
  - [ ] Start Docker: `docker compose up -d`
  - [ ] Install Stripe CLI
  - [ ] Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  - [ ] In another terminal: `stripe trigger checkout.session.completed`
  - [ ] Verify webhook received and processed
  - [ ] Check database for user update
  - [ ] Verify deployment triggered
  - [ ] Check email sent
  - [ ] Verify no errors in logs

### [ ] Test: End-to-End Checkout Flow (1 hour)
- **Checklist:**
  - [ ] Visit http://localhost:3000/pricing
  - [ ] Click "Get Started" on Starter plan
  - [ ] Verify redirect to Stripe Checkout
  - [ ] Use test card: 4242 4242 4242 4242 / 12/34 / 567
  - [ ] Complete payment
  - [ ] Verify redirect to success page
  - [ ] Verify success page shows correct plan
  - [ ] Check database: user plan updated
  - [ ] Check email: receipt received
  - [ ] Check docker: new container deployed
  - [ ] Check dashboard: agent visible

### [ ] Test: Webhook Delivery (30 min)
- **Checklist:**
  - [ ] Manual webhook trigger in Stripe test dashboard
  - [ ] Verify signature validation passes
  - [ ] Check idempotency (trigger same webhook twice)
  - [ ] Verify second trigger returns same result
  - [ ] Check database: only one entry created

### [ ] Setup: Create Stripe Live Account (1 hour)
- **Checklist:**
  - [ ] Create account at https://stripe.com
  - [ ] Verify email and complete KYC
  - [ ] Create 5 products:
    - [ ] AgentBot Starter (£19/mo)
    - [ ] AgentBot Pro (£39/mo)
    - [ ] AgentBot Scale (£79/mo)
    - [ ] AgentBot Enterprise (£149/mo)
    - [ ] AgentBot White Glove (£199/mo)
  - [ ] Copy Price IDs for each
  - [ ] Get API keys from https://dashboard.stripe.com/apikeys
  - [ ] Copy Secret Key and Publishable Key
  - [ ] Configure webhook endpoint
  - [ ] Select events to subscribe to

### [ ] Deploy: Configure Environment (30 min)
- **File:** `.env` (production)
- **Checklist:**
  - [ ] Copy .env.production to .env
  - [ ] Replace STRIPE_SECRET_KEY with live key (sk_live_...)
  - [ ] Replace NEXT_PUBLIC_STRIPE_PUBLIC_KEY with live key (pk_live_...)
  - [ ] Replace STRIPE_WEBHOOK_SECRET with live secret
  - [ ] Add all 5 STRIPE_PRICE_xxx variables
  - [ ] Configure SMTP variables for email
  - [ ] Verify all env vars set
  - [ ] Never commit .env file!

### [ ] Deploy: Update Docker Compose (20 min)
- **File:** `docker-compose.yml`
- **Checklist:**
  - [ ] Verify all Stripe env vars are passed to containers
  - [ ] Verify BACKEND_API_URL points to correct host
  - [ ] Verify INTERNAL_API_KEY is set
  - [ ] Test build: `docker compose build`

### [ ] Deploy: Push to Production (30 min)
- **Checklist:**
  - [ ] Ensure all code changes committed
  - [ ] All environment variables configured
  - [ ] SSH into production server
  - [ ] Pull latest code: `git pull`
  - [ ] Update docker images: `docker compose pull`
  - [ ] Restart services: `docker compose up -d`
  - [ ] Verify all containers running: `docker ps`
  - [ ] Check logs: `docker logs agentbot-frontend`
  - [ ] Visit https://agentbot.raveculture.xyz/pricing
  - [ ] Test checkout with real Stripe payment

### [ ] Post-Deploy: Monitoring (20 min)
- **Checklist:**
  - [ ] Monitor webhook deliveries in Stripe dashboard
  - [ ] Check application logs for errors
  - [ ] Test support email for issues
  - [ ] Monitor payment success rate
  - [ ] Track deployment completion times

**Subtotal Phase 3: ~3.5 hours**

---

## PRIORITY SUMMARY

| Priority | Items | Est. Time | Status |
|----------|-------|-----------|--------|
| 🔴 CRITICAL | 5 fixes | 3.25 hrs | [ ] PENDING |
| 🟠 HIGH | 5 improvements | 3 hrs | [ ] PENDING |
| 🟡 MEDIUM | Testing | 3.5 hrs | [ ] PENDING |
| **TOTAL** | **15 items** | **~10 hrs** | [ ] |

---

## CRITICAL PATH (Minimum to Deploy)

If you're in a rush, minimum viable fixes:

1. ✅ Fix webhook signature (30 min) → Webhooks work
2. ✅ Create success page (30 min) → User sees confirmation
3. ✅ Create email service (1 hr) → Notifications work
4. ✅ Update DB schema (30 min) → Data persists
5. ✅ Add deployment trigger (45 min) → Services deploy
6. ✅ Create backend endpoint (1 hr) → Deployment receives requests
7. ✅ Smoke test (1 hr) → Verify flow works
8. ✅ Setup Stripe live (1 hr) → Production ready
9. ✅ Deploy (1 hr) → LIVE ✅

**Minimum time: 7-8 hours**

---

## SUCCESS CRITERIA

### Phase 1 Complete When:
- [ ] Webhook signature validation passes
- [ ] Success page renders after payment
- [ ] Database updated with subscription fields
- [ ] Email sent after payment
- [ ] Deployment triggered on payment

### Phase 2 Complete When:
- [ ] All env vars validated
- [ ] Rate limiting prevents abuse
- [ ] Idempotency prevents double-charging
- [ ] Lifecycle handlers implemented
- [ ] No errors in logs

### Phase 3 Complete When:
- [ ] End-to-end checkout works locally
- [ ] Webhooks deliver and process
- [ ] Stripe live account configured
- [ ] Production deployment successful
- [ ] First live payment processed

---

## ROLLBACK PLAN

If production deployment fails:

```bash
# Revert to previous version
git revert HEAD
docker compose up -d

# Or restore from backup
docker compose stop
restore-backup.sh
docker compose up -d
```

---

## FAQ

**Q: Can I skip the email service?**  
A: No - webhook will crash. You must implement it.

**Q: Can I deploy with test Stripe keys?**  
A: No - will only accept test cards. Use live keys for production.

**Q: How long will Phase 1 take?**  
A: 3-4 hours if you follow the guides. Could be faster if you're experienced.

**Q: What if Phase 1 breaks something?**  
A: You can revert with git. All changes are isolated per file.

**Q: When should I do Phase 2?**  
A: After Phase 1 works. Phase 2 adds production hardening.

**Q: Can I skip Phase 3 testing?**  
A: Not recommended. Testing catches 80% of issues before production.

---

## CONTACTS & RESOURCES

- **Stripe Docs:** https://stripe.com/docs
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Docker Docs:** https://docs.docker.com

---

**Status:** 🚫 **DO NOT DEPLOY YET** - Complete checklist first  
**Next Action:** Start with Critical Fix #1 (webhook signature)  
**Time to Production:** ~8-10 hours from now
