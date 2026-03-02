# AgentBot - Stripe Subscription Model

## Overview

AgentBot now uses **Stripe for subscription management** with **automatic service deployment** after payment.

## Pricing Tiers

### Starter - £19/mo
- 1 AI Agent
- 2GB RAM, 1 CPU
- 10GB storage
- Telegram channel
- Use your own AI key

### Pro - £39/mo + usage
- 1 AI Agent
- 4GB RAM, 2 CPU
- 50GB storage
- Telegram + WhatsApp
- Custom domain

### Scale - £79/mo
- 3 AI Agents
- 8GB RAM, 4 CPU
- 100GB storage
- All channels
- Advanced analytics

### Enterprise - £149/mo
- Unlimited agents
- 16GB RAM, 4 CPU
- 500GB storage
- White-label options
- 24/7 phone support

### White Glove - £199/mo
- Everything in Enterprise
- 10x resources
- Dedicated account manager
- Priority 24/7 support
- Custom SLA

---

## Setup Instructions

### 1. Create Stripe Account
- Go to https://stripe.com
- Create account and go to Dashboard
- Get API keys (Secret Key and Publishable Key)

### 2. Create Products in Stripe

For each tier, create:
1. Product (e.g., "AgentBot Starter")
2. Price (recurring, monthly, GBP)

Copy the Price IDs.

### 3. Update Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_SCALE=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
STRIPE_PRICE_WHITEGLOVE=price_xxx
```

### 4. Setup Webhook

In Stripe Dashboard:
1. Go to Webhooks
2. Add endpoint: `https://agentbot.raveculture.xyz/api/webhooks/stripe`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy Webhook Secret to `STRIPE_WEBHOOK_SECRET`

### 5. Restart Services

```bash
docker compose restart frontend
```

---

## User Flow

### Step 1: View Pricing
User visits: `https://agentbot.raveculture.xyz/pricing`

### Step 2: Select Plan
Click "Get Started" on desired tier

### Step 3: Checkout
- Redirected to Stripe Checkout
- Enter card details
- Confirm payment

### Step 4: Automatic Deployment
After payment:
1. Stripe sends webhook confirmation
2. Backend receives webhook
3. Service automatically deploys
4. User redirected to success page
5. Dashboard access granted
6. Email confirmation sent

### Step 5: Use Service
User can now:
- Deploy AI agents
- Manage settings
- Monitor usage
- Upgrade/downgrade plan

---

## API Endpoints

### Create Checkout Session
```
POST /api/checkout
{
  "tierId": "starter",
  "email": "user@example.com"
}

Response:
{
  "url": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_xxx"
}
```

### Webhook Handler
```
POST /api/webhooks/stripe
(Stripe sends event payload)

Handles:
- checkout.session.completed → Deploy service
- customer.subscription.updated → Update resources
- customer.subscription.deleted → Deactivate service
- invoice.payment_succeeded → Confirm payment
- invoice.payment_failed → Handle failure
```

### Verify Checkout
```
GET /api/checkout/verify?session_id=cs_xxx

Response:
{
  "plan": "Starter",
  "status": "active",
  "nextBilling": "2024-03-26"
}
```

---

## Subscription Management

### For Users

**Change Plan**
- Dashboard → Settings → Billing
- Select new tier
- Confirm upgrade/downgrade
- Takes effect immediately (prorated)

**Cancel Subscription**
- Dashboard → Settings → Billing
- Click "Cancel Plan"
- Confirm cancellation
- Access revoked at end of billing period

**View Invoice**
- Dashboard → Settings → Billing → Invoices
- Download or email invoice

### For Admin

**View All Subscriptions**
- Admin Dashboard → Subscriptions
- Filter by status, tier, date
- Export to CSV

**Manual Actions**
- Refund payment
- Extend trial
- Update billing info
- Send invoice reminder

---

## Resource Limits

AgentBot automatically enforces tier limits:

### Starter
```
agents: 1
ram: 2GB
cpu: 1
storage: 10GB
channels: [telegram]
```

### Pro
```
agents: 1
ram: 4GB
cpu: 2
storage: 50GB
channels: [telegram, whatsapp]
customDomain: true
```

### Scale
```
agents: 3
ram: 8GB
cpu: 4
storage: 100GB
channels: [telegram, whatsapp, discord]
analytics: true
```

### Enterprise
```
agents: unlimited
ram: 16GB
cpu: 4
storage: 500GB
channels: [all]
whiteLabelOption: true
support: 24/7 phone
```

### White Glove
```
agents: unlimited
ram: 160GB
cpu: 40
storage: 5000GB
channels: [all + custom]
dedicatedManager: true
support: Priority 24/7
customSLA: true
```

---

## Auto-Deployment Process

When user completes checkout:

1. **Webhook Event** - Stripe sends `checkout.session.completed`
2. **Verification** - Webhook handler verifies signature
3. **Data Extraction** - Get customer ID, tier, subscription ID
4. **Backend Call** - POST to `/api/subscriptions/deploy`
5. **Resource Allocation** - Backend reserves resources for tier
6. **Container Deployment** - Kubernetes/Docker deployment created
7. **Service Setup** - Configure networking, storage, monitoring
8. **Activation** - Service goes live with unique subdomain
9. **Email Notification** - Send dashboard link to user
10. **Access Grant** - User can login and start using

**Time to deployment:** 30-60 seconds

---

## Webhook Events Handled

### checkout.session.completed
- Deploy service
- Create user account
- Send welcome email
- Grant dashboard access

### customer.subscription.updated
- Update resource limits
- Handle tier upgrades
- Handle tier downgrades (prorated)

### customer.subscription.deleted
- Deactivate service
- Revoke access
- Preserve data (30-day grace)

### invoice.payment_succeeded
- Renew access
- Send receipt
- Update billing status

### invoice.payment_failed
- Notify user
- Suspend service (after 3 attempts)
- Allow retry

---

## Testing in Development

### Use Stripe Test Keys
```
Secret Key: sk_test_xxx (not sk_live_xxx)
Publishable Key: pk_test_xxx (not pk_live_xxx)
Webhook Secret: whsec_test_xxx
```

### Test Payment Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Any expiry: 12/34
- Any CVC: 567

### Test Webhook Locally
```bash
# Use Stripe CLI to forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Get webhook secret
stripe listen --print-secret
```

---

## Going Live

### 1. Switch to Live Keys
Update production .env:
```
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxx
```

### 2. Verify Webhook
Test endpoint receives events in Stripe Dashboard

### 3. Update Prices
Ensure production prices are set in Stripe

### 4. Monitor
- Check webhook logs in Stripe
- Monitor deployments
- Track failed payments

---

## Revenue & Analytics

### Track Revenue
Stripe Dashboard → Analytics → Revenue
- Monthly recurring revenue (MRR)
- Annual recurring revenue (ARR)
- Churn rate
- Expansion revenue

### Export Data
- Revenue reports
- Subscription lists
- Customer data
- Invoice history

---

## Support

For questions about Stripe integration:
- Email: stripe-support@agentbot.raveculture.xyz
- Stripe Docs: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api

