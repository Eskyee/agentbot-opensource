# AgentBot Stripe Integration - Comprehensive Code Review

**Date:** February 24, 2025  
**Status:** ⚠️ **CRITICAL ISSUES FOUND** - Not production-ready  
**Overall Assessment:** 65% ready with significant gaps

---

## Executive Summary

The Stripe subscription system has **foundational code in place** but contains **critical missing components** and **security concerns** that must be addressed before production deployment to `https://agentbot.raveculture.xyz`.

### What's Working ✅
- Pricing page component with all 5 tiers UI
- Stripe checkout session creation with dynamic price discovery
- Webhook handler with signature verification (mostly correct)
- Database schema for plan storage
- Email notification system skeleton
- Plan resource mapping (RAM/CPU per tier)

### What's Broken ❌
1. **Webhook signature verification using incorrect algorithm** (crypto.createHmac instead of Stripe library)
2. **No backend deployment endpoint** (`/api/subscriptions/deploy` mentioned but missing)
3. **Missing success page** (`/checkout/success` does not exist)
4. **No idempotency handling** in webhooks (could charge same customer twice)
5. **Hardcoded plan prices** (not reading from Stripe - defeats API purpose)
6. **No subscription lifecycle management** (no cancellation, downgrade, or renewal handlers)
7. **Email system not fully integrated** (`sendEmail`, `sendPaymentReceiptEmail` imported but not available)
8. **Missing environment variable documentation** and validation
9. **No rate limiting** on checkout endpoint (vulnerable to abuse)
10. **No test fixtures** or smoke test scripts

---

## 1. CRITICAL ISSUES (Must Fix Before Production)

### 1.1 ⛔ Webhook Signature Verification Bug

**File:** `web/app/api/stripe/webhook/route.ts`  
**Severity:** CRITICAL - Security vulnerability

**Current Code:**
```typescript
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
  .update(body, 'utf8')
  .digest('hex');

if (signature !== expectedSignature) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

**Problems:**
- This is incorrect. Stripe sends signature as `t=<timestamp>,v1=<signature>`
- The code compares wrong format (signature format is `t=timestamp,v1=hash` not just `hash`)
- Webhook secret should NOT be used in createHmac directly; Stripe provides pre-formatted string
- Missing timestamp validation (vulnerable to replay attacks)

**Required Fix:**
```typescript
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const event = Stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Process event...
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook parsing failed' }, { status: 400 });
  }
}
```

---

### 1.2 ⛔ Missing Deployment Trigger Integration

**File:** `web/app/api/stripe/webhook/route.ts`  
**Severity:** CRITICAL - System doesn't actually provision services

**Current Problem:**
The webhook handler updates the database but **never calls the backend to provision the deployment**. Per the summary, it should call `/api/subscriptions/deploy` endpoint on the backend, but this endpoint doesn't exist.

**Current Code (Line 38-47):**
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    plan: mappedPlan,
    stripeSubscriptionId: session.subscription as string || null,
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date()
  }
});
console.log(`Updated user ${userId} with plan ${mappedPlan}`);
```

**Required Implementation:**
After updating user, must trigger deployment:
```typescript
// After user update, trigger deployment
const deploymentResponse = await fetch(
  `${process.env.BACKEND_API_URL}/api/subscriptions/deploy`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
    },
    body: JSON.stringify({
      userId,
      plan: mappedPlan,
      email: customerEmail,
      stripeSubscriptionId: session.subscription
    })
  }
);

if (!deploymentResponse.ok) {
  console.error('Deployment failed:', await deploymentResponse.text());
  // Consider whether to fail webhook or retry with queue
}
```

**Note:** The backend `/api/subscriptions/deploy` endpoint needs to be created in `agentbot-backend/src/index.ts`. Currently, the `/api/deployments` POST endpoint exists but expects `agentId` and `config` (Telegram token, etc.), not subscription info.

---

### 1.3 ⛔ Missing Success Page

**File:** `web/app/checkout/success/page.tsx`  
**Severity:** HIGH - User has no confirmation page

**Current Problem:**
The checkout route redirects to:
```typescript
success_url: `${origin}/onboard?plan=${plan}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
```

But there's **no `/onboard` page** that displays `paid=1` properly. User sees onboarding but no "payment confirmed" message.

**Required Fix:**
Create `web/app/checkout/success/page.tsx`:
```typescript
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verified, setVerified] = useState(false)
  const [plan, setPlan] = useState('')
  const sessionId = searchParams.get('session_id')
  const planParam = searchParams.get('plan')

  useEffect(() => {
    if (!sessionId) {
      router.push('/pricing?error=missing_session')
      return
    }

    // Verify session on backend
    const verify = async () => {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setPlan(data.plan)
          setVerified(true)
        } else {
          router.push('/pricing?error=verification_failed')
        }
      } catch {
        router.push('/pricing?error=verification_error')
      }
    }

    verify()
  }, [sessionId, router])

  if (!verified) {
    return <div className="min-h-screen bg-black flex items-center justify-center">Verifying payment...</div>
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Payment Confirmed</h1>
          <p className="text-gray-400 mb-6">
            Welcome to {plan} plan! Your service will be deployed shortly.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
```

Also create the verification endpoint `web/app/api/stripe/verify-session/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return NextResponse.json({
      plan: session.metadata?.plan || 'unknown',
      status: session.payment_status
    })
  } catch (error) {
    return NextResponse.json({ error: 'Session verification failed' }, { status: 400 })
  }
}
```

---

### 1.4 ⛔ Hardcoded Plan Prices Defeats Dynamic Pricing

**File:** `web/app/api/stripe/checkout/route.ts` (Line 5-10)  
**Severity:** HIGH - Defeats Stripe's purpose

**Current Code:**
```typescript
const PLAN_PRICES: Record<string, { amount: number; name: string; description: string }> = {
  starter: { amount: 1900, name: 'Starter Plan', description: '...' },
  pro: { amount: 3900, name: 'Pro Plan', description: '...' },
  // etc
};
```

**Problem:**
- Prices are hardcoded in code (bad for changes, requires deployment)
- The `stripe-pricing.ts` file exists with fallback prices but isn't used
- If you want to change prices in Stripe dashboard, the code won't pick them up
- Lines 17-33 try to find active prices dynamically but are never used

**Required Fix:**
Replace hardcoding with Stripe Price IDs from env vars:

```typescript
const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  scale: process.env.STRIPE_PRICE_SCALE || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
  white_glove: process.env.STRIPE_PRICE_WHITEGLOVE || '',
};

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  const validPlans = Object.keys(PLAN_PRICE_IDS)
  if (!validPlans.includes(plan) || !PLAN_PRICE_IDS[plan]) {
    return NextResponse.redirect(new URL(`/pricing?error=invalid_plan`, origin), 303)
  }

  // Use the price ID, not amount
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: PLAN_PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    // ...
  })
}
```

---

### 1.5 ⛔ Missing Idempotency Keys for Webhooks

**File:** `web/app/api/stripe/webhook/route.ts`  
**Severity:** HIGH - Could charge user multiple times

**Problem:**
Stripe can retry webhooks. Without idempotency handling, the same payment could be processed twice.

**Current Code:** No idempotency tracking

**Required Fix:**
Add idempotency tracking to database:

```typescript
// In webhook handler, add this at the top of each case:

const idempotencyKey = `${event.id}-${event.type}`;

// Check if already processed
const existing = await prisma.webhookEvent.findUnique({
  where: { eventId: idempotencyKey }
});

if (existing) {
  console.log(`Webhook already processed: ${idempotencyKey}`);
  return NextResponse.json({ received: true });
}

// ... process webhook ...

// Mark as processed
await prisma.webhookEvent.create({
  data: {
    eventId: idempotencyKey,
    type: event.type,
    processedAt: new Date()
  }
});
```

Add to schema (need Prisma schema update):
```prisma
model WebhookEvent {
  id String @id @default(cuid())
  eventId String @unique
  type String
  processedAt DateTime @default(now())
}
```

---

## 2. HIGH PRIORITY ISSUES (Complete Before Launch)

### 2.1 Missing Environment Variable Validation

**Severity:** HIGH

**Issue:** No startup validation of required Stripe config.

**Current Code:** `web/app/api/stripe/checkout/route.ts` checks `stripeKey` but only at request time.

**Required Fix:**
Add to `web/app/layout.tsx` or separate config validation:

```typescript
// lib/config.ts
export function validateStripeConfig() {
  const required = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_SCALE',
    'STRIPE_PRICE_ENTERPRISE',
    'STRIPE_PRICE_WHITEGLOVE',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing Stripe config: ${missing.join(', ')}`);
  }

  if (missing.length > 0) {
    console.warn(`Warning: Missing Stripe config in development: ${missing.join(', ')}`);
  }
}

// Call on startup
if (typeof window === 'undefined') {
  validateStripeConfig();
}
```

---

### 2.2 Email System Integration Missing

**File:** `web/app/api/stripe/webhook/route.ts` (Line 1-2)  
**Severity:** HIGH

**Current Code:**
```typescript
import { sendEmail, sendPaymentReceiptEmail } from '../../../lib/email';
```

**Problem:** These functions are imported but:
- No `lib/email.ts` file exists
- No email provider configured (SendGrid, Resend, AWS SES?)
- `sendPaymentReceiptEmail` called but not defined

**Required Fix:**
Create `web/app/lib/email.ts`:

```typescript
import nodemailer from 'nodemailer';
// OR use: import { Resend } from 'resend';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@agentbot.com',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
}

export async function sendPaymentReceiptEmail(
  to: string,
  amount: number,
  plan: string
) {
  const formattedAmount = (amount / 100).toFixed(2);
  
  return sendEmail({
    to,
    subject: `AgentBot Payment Receipt - ${plan} Plan`,
    html: `
      <h1>Payment Confirmed</h1>
      <p>Thank you for your purchase!</p>
      <p><strong>Plan:</strong> ${plan}</p>
      <p><strong>Amount:</strong> £${formattedAmount}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr />
      <p>Access your dashboard: <a href="https://agentbot.raveculture.xyz/dashboard">Dashboard</a></p>
      <p>Best,<br>The AgentBot Team</p>
    `,
  });
}
```

Update `.env.production`:
```
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@agentbot.com
```

---

### 2.3 No Rate Limiting on Checkout Endpoint

**File:** `web/app/api/stripe/checkout/route.ts`  
**Severity:** MEDIUM

**Problem:** Endpoint can be called unlimited times per user, creating many checkout sessions.

**Required Fix:**
Use Redis-based rate limiting:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `checkout:${ip}`;
  
  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) {
    await redis.expire(rateLimitKey, 60); // 1 minute window
  }
  
  if (attempts > 5) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please try again in 1 minute.' },
      { status: 429 }
    );
  }

  // ... rest of checkout logic ...
}
```

---

### 2.4 No Subscription Lifecycle Handlers

**File:** `web/app/api/stripe/webhook/route.ts`  
**Severity:** HIGH

**Missing Events:**
- `customer.subscription.deleted` - user cancelled
- `customer.subscription.updated` - plan changed
- `invoice.payment_failed` - payment retry logic
- `charge.dispute.created` - chargeback handling

**Required Implementation:**
```typescript
case 'customer.subscription.deleted': {
  const subscription = event.data.object;
  const customerId = subscription.customer;
  
  // Find user by Stripe customer ID and mark as cancelled
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });
  
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'free',
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date()
      }
    });
    
    // Notify user
    await sendEmail({
      to: user.email,
      subject: 'Your AgentBot subscription has been cancelled',
      html: `<p>Your subscription has been cancelled. You can resubscribe anytime.</p>`
    });
  }
  break;
}
```

---

## 3. MEDIUM PRIORITY ISSUES

### 3.1 Missing .env Validation in Frontend

**File:** `.env.frontend`  
**Issue:** Frontend doesn't validate Stripe keys at build time

**Required Fix:**
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

// Validate Stripe config at build time
if (process.env.NODE_ENV === 'production') {
  const requiredVars = [
    'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

module.exports = nextConfig;
```

---

### 3.2 Database Schema Incomplete

**Severity:** MEDIUM

**Issue:** Subscription fields may not exist in user schema

**Required Prisma Migration:**
```prisma
model User {
  // ... existing fields ...
  
  // Stripe subscription fields
  stripeCustomerId    String?    @unique
  stripeSubscriptionId String?   @unique
  plan               String     @default("free")
  subscriptionStatus  String?    // "active", "cancelled", "past_due"
  subscriptionStartDate DateTime?
  subscriptionEndDate DateTime?
  
  // Webhook tracking
  webhookEvents      WebhookEvent[]
}

model WebhookEvent {
  id        String   @id @default(cuid())
  eventId   String   @unique
  type      String
  userId    String?
  processedAt DateTime @default(now())
}
```

Run:
```bash
npx prisma migrate dev --name add_stripe_fields
npx prisma generate
```

---

### 3.3 Pricing Page Missing Yearly Option

**File:** `web/app/pricing/page.tsx`  
**Issue:** Yearly toggle is disabled but summary mentions "-20% yearly"

**Current Code (Line 223-230):**
```typescript
<button
  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
  aria-pressed="false"
  disabled  // ← Disabled
>
  Yearly <span className="ml-1 text-green-400">-20%</span>
</button>
```

**Options:**
1. Remove toggle if yearly not supported
2. Implement yearly pricing with separate Stripe prices
3. Create yearly products in Stripe and use in checkout

---

## 4. TESTING & DEPLOYMENT CHECKLIST

### 4.1 Pre-Production Testing

- [ ] **Unit Tests**
  ```bash
  npm test -- checkout.route.ts
  npm test -- webhook.route.ts
  ```

- [ ] **Webhook Signature Verification**
  - Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  - Generate test webhook: `stripe trigger payment_intent.succeeded`
  - Verify it doesn't error with signature verification

- [ ] **Checkout Flow**
  1. Visit `/pricing`
  2. Click "Get Started" on Starter plan
  3. Enter Stripe test card: `4242 4242 4242 4242` / `12/34` / `567`
  4. Verify redirect to success page (after creating success page)
  5. Check database: user should have `plan: 'starter'`

- [ ] **Webhook Delivery**
  - Manually trigger webhook in Stripe dashboard
  - Check logs: should see user updated
  - (After fixing) Check deployment started

- [ ] **Environment Variables**
  - All Stripe keys configured
  - All database URLs correct
  - Email credentials working

### 4.2 Production Deployment Steps

```bash
# 1. Create Stripe products/prices in production
# - 5 products (Starter, Pro, Scale, Enterprise, White Glove)
# - Prices in GBP, monthly recurring
# - Note the Price IDs

# 2. Update .env with live Stripe keys (NOT test keys!)
# Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER=price_xxx
# ... etc for all 5

# 3. Configure webhook endpoint
# Stripe Dashboard → Webhooks
# Endpoint: https://agentbot.raveculture.xyz/api/stripe/webhook
# Events: checkout.session.completed, customer.subscription.*

# 4. Deploy
docker compose up -d

# 5. Verify
curl https://agentbot.raveculture.xyz/health
curl https://agentbot.raveculture.xyz/pricing
```

---

## 5. SECURITY CONCERNS

### 5.1 SQL Injection in Webhook Handler
**Status:** ✅ Safe - Using Prisma

### 5.2 CSRF in Checkout
**Status:** ⚠️ Monitor - Next.js handles, but verify SameSite cookies

### 5.3 API Key Exposure
**Status:** ⚠️ Risk - Stripe keys in .env files
**Mitigation:** Use AWS Secrets Manager or HashiCorp Vault in production

### 5.4 Webhook Replay Attack
**Status:** ❌ Not Protected - No timestamp validation
**Fix:** Add Stripe library verification (see section 1.1)

---

## 6. FILE STATUS INVENTORY

| File | Exists | Status | Issues |
|------|--------|--------|--------|
| `web/app/pricing/page.tsx` | ✅ | Good | Yearly toggle disabled |
| `web/app/api/stripe/checkout/route.ts` | ✅ | Needs Fix | Hardcoded prices, no rate limit |
| `web/app/api/stripe/webhook/route.ts` | ✅ | Critical | Wrong signature validation, no idempotency |
| `web/app/api/stripe/verify-session/route.ts` | ❌ | Missing | Required for success page |
| `web/app/checkout/success/page.tsx` | ❌ | Missing | User sees no confirmation |
| `web/app/lib/email.ts` | ❌ | Missing | Email not configured |
| `web/app/lib/stripe.ts` | ❌ | Missing | Could centralize Stripe client |
| `web/app/lib/pricing.ts` | ❌ | Missing | Should define pricing |
| `agentbot-backend/src/subscriptions.ts` | ❌ | Missing | Deployment endpoint |
| Database migrations | ❌ | Missing | Prisma schema incomplete |

---

## 7. QUICK FIXES PRIORITY ORDER

### Must Do (This Week)
1. **Fix webhook signature verification** (security critical)
2. **Create success page & verification endpoint**
3. **Add deployment trigger to webhook**
4. **Update database schema with subscription fields**
5. **Configure email system**

### Should Do (Before Launch)
6. Create `/api/subscriptions/deploy` endpoint in backend
7. Add idempotency to webhooks
8. Use environment-based prices (not hardcoded)
9. Add rate limiting
10. Implement subscription lifecycle handlers

### Nice To Have
11. Add email verification flow
12. Implement yearly pricing
13. Create smoke test scripts
14. Add monitoring/alerting

---

## 8. ESTIMATED TIMELINE

- **Phase 1 (Critical Fixes):** 4-6 hours
- **Phase 2 (Deployment Ready):** 2-3 hours  
- **Phase 3 (Testing & Launch):** 2-3 hours
- **Total:** ~10 hours

---

## 9. DEPLOYMENT COMMANDS

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed

# Build and run production
docker build -t agentbot-web ./web
docker compose -f docker-compose.prod.yml up -d

# Monitor
docker logs agentbot-frontend -f
docker logs agentbot-api -f
```

---

## Next Steps

1. **Address critical issues** in section 1
2. **Create the missing files** (section 6)
3. **Run smoke tests** (section 4.1)
4. **Deploy to staging** first
5. **Only then** deploy to production

**Status:** 🚫 **DO NOT DEPLOY YET** - Wait for Phase 1 completion.
