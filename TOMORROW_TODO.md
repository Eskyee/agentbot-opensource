# AgentBot Stripe - Tomorrow's Action Items

**Status:** Phase 1 ✅ COMPLETE  
**Next:** Phase 2 - Test & Production Ready  
**Date:** February 25, 2025

---

## Critical Path (Do These First)

### STEP 1: Database Migration (5 min)
```bash
cd ./agentbot/web
npx prisma migrate dev --name add_stripe_subscription_fields
npx prisma generate
```

**What It Does:**
- Creates WebhookEvent table for idempotency
- Adds Stripe fields to User table
- Updates database schema

**If It Fails:**
- Check DATABASE_URL is set correctly
- Check PostgreSQL is running
- Check Prisma is installed: `npm list prisma`

---

### STEP 2: Build Check (5 min)
```bash
cd ./agentbot/web
npm run build
```

**What It Does:**
- Generates Prisma client
- Compiles TypeScript
- Checks for import/syntax errors

**If It Fails:**
- Check for red squiggles in code
- Verify all files were created (especially new ones)
- Check .env has STRIPE_SECRET_KEY set

---

### STEP 3: Install Stripe CLI (10 min)
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from:
https://github.com/stripe/stripe-cli/releases
```

**Verify Installation:**
```bash
stripe --version  # Should print version number
```

---

### STEP 4: Local Stripe Testing (20 min)
```bash
# Terminal 1: Start webhook listener
cd ./agentbot
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret and add to .env:
# STRIPE_WEBHOOK_SECRET=whsec_test_...

# Terminal 2: In new terminal, trigger test event
stripe trigger checkout.session.completed

# Terminal 3: Watch Docker logs
docker logs agentbot-frontend -f
docker logs agentbot-api -f
```

**Success Criteria:**
- ✅ Webhook received in Terminal 1
- ✅ No errors in logs
- ✅ Database updated (check)
- ✅ Email sent (check logs)

---

### STEP 5: Manual End-to-End Test (20 min)
```bash
# 1. Visit pricing page
http://localhost:3000/pricing

# 2. Click "Get Started" on Pro plan

# 3. Fill Stripe Checkout with test card:
Email: test@example.com
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 567
Name: Test User
Zip: 12345

# 4. Click "Pay"

# 5. Should redirect to success page showing:
✓ "Payment Confirmed!"
✓ Plan name (Pro)
✓ "Go to Dashboard" button

# 6. Check database
select plan, "subscriptionStatus" from "User" where email = 'test@example.com';
# Should show: pro | active
```

**If Test Fails:**
- Check console errors (F12 in browser)
- Check backend logs: `docker logs agentbot-api -f`
- Check webhook logs: `docker logs agentbot-frontend -f`
- See TROUBLESHOOTING section below

---

## Phase 2 Items (If Time Permits)

### Rate Limiting (30 min)
- Add Redis rate limiting to checkout endpoint
- Prevent checkout spam
- Return 429 if exceeded

### Webhook Lifecycle Handlers (45 min)
- Add `customer.subscription.deleted` handler
- Add `invoice.payment_failed` handler
- Send appropriate emails

### Production Env Vars (20 min)
- Create final .env file
- Validate all variables
- Document for deployment team

---

## Pre-Production Checklist

Before deploying to production, ensure:

- [ ] Database migration completed
- [ ] Local smoke test passed
- [ ] No errors in Docker logs
- [ ] Success page displays correctly
- [ ] Email was received
- [ ] Deployment was triggered
- [ ] All env vars documented
- [ ] Stripe test account working
- [ ] Code compiled successfully
- [ ] All new files committed to git

---

## Troubleshooting

### Webhook Not Received
```bash
# Check Stripe CLI is listening
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger
stripe trigger checkout.session.completed

# Check webhook logs show "Received" message
```

### Success Page Shows Error
```bash
# Check backend logs
docker logs agentbot-api -f

# Check for 500 errors
# Likely: STRIPE_SECRET_KEY not set or invalid
```

### Email Not Received
```bash
# Check RESEND_API_KEY is set
echo $RESEND_API_KEY

# Check logs for email errors
docker logs agentbot-frontend -f

# Look for "Email sent to" message
# If missing, email service not initialized
```

### Database Migration Failed
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Verify PostgreSQL is running
docker ps | grep postgres

# Check Prisma syntax
npx prisma db push
```

### Build Fails
```bash
# Check TypeScript errors
cd agentbot/web
npx tsc --noEmit

# Check missing imports
grep -r "sendEmail\|sendPaymentReceipt" app/

# Verify all new files exist
ls -la app/lib/email.ts
ls -la app/api/stripe/verify-session/route.ts
ls -la app/checkout/success/page.tsx
```

---

## Quick Command Reference

```bash
# Start all services
docker compose up -d

# View logs
docker logs agentbot-frontend -f
docker logs agentbot-api -f
docker logs agentbot-postgres -f

# Run database migration
cd web && npx prisma migrate dev --name migration_name

# Generate Prisma client
npx prisma generate

# Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
stripe events list

# Check env vars
echo $STRIPE_SECRET_KEY
echo $RESEND_API_KEY
echo $DATABASE_URL

# Clean up Docker
docker compose down -v  # Remove volumes too
docker system prune -a
```

---

## Files to Review Before Testing

Before running tests, review these new/modified files:
- [ ] `web/app/api/stripe/webhook/route.ts` - Main webhook handler
- [ ] `web/app/checkout/success/page.tsx` - Success page UI
- [ ] `web/app/lib/email.ts` - Email service
- [ ] `agentbot-backend/src/subscriptions.ts` - Deployment endpoint
- [ ] `web/prisma/schema.prisma` - Database schema

---

## Expected Test Results

After completing all tests, you should see:

✅ Webhook received and processed  
✅ Database updated with plan  
✅ Success page displayed  
✅ Email receipt received  
✅ Deployment triggered  
✅ Agent container created  
✅ No errors in logs  

---

## Contact for Help

If stuck:
1. Check TROUBLESHOOTING section above
2. Check `STRIPE_INTEGRATION_CODE_REVIEW.md` for details
3. Check logs: `docker logs <container> -f`
4. Check database directly: `psql $DATABASE_URL`

---

**Goal:** Complete Phase 2 by end of day tomorrow, be ready to deploy to production Wednesday!

Good luck! 🚀
