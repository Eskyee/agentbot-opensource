# AgentBot Stripe System - Status & Action Items

**Last Updated:** February 24, 2025  
**Review Status:** ✅ Complete  
**Production Readiness:** 🚫 NOT READY - 5+ critical issues found

---

## Quick Summary

Your Stripe subscription system is **65% complete** with solid foundations but **5 critical issues** that will cause payment processing to fail in production. These must be fixed before launch.

### Can Deploy If... ✅ WHEN READY
- [ ] Webhook signature verification fixed
- [ ] Success page created
- [ ] Backend deployment endpoint created
- [ ] Database schema updated
- [ ] Email system configured

### Cannot Deploy Until...❌
- All 5 critical issues above are fixed
- Smoke tests pass
- Stripe account configured with live keys
- Environment variables validated

---

## Critical Issues Summary

| Issue | Impact | Fix Time | Priority |
|-------|--------|----------|----------|
| Webhook signature validation broken | **Will fail all webhooks** | 30 min | 🔴 CRITICAL |
| No deployment trigger | **Users pay but service not deployed** | 1 hr | 🔴 CRITICAL |
| Missing success page | **No payment confirmation UI** | 30 min | 🔴 CRITICAL |
| Database schema incomplete | **Subscription fields missing** | 30 min | 🔴 CRITICAL |
| No email system | **Can't send receipts/notifications** | 1 hr | 🔴 CRITICAL |

**Total Fix Time:** ~4 hours

---

## What Works Right Now ✅

1. **Pricing Page** (`web/app/pricing/page.tsx`)
   - Beautiful UI with all 5 plans
   - Resource badges showing RAM/CPU per tier
   - Features comparison
   - Checkout buttons functional

2. **Stripe Checkout** (`web/app/api/stripe/checkout/route.ts`)
   - Creates sessions correctly
   - Handles all 5 plan types
   - Redirects to Stripe Checkout UI
   - Session metadata includes plan name

3. **Webhook Handler** (`web/app/api/stripe/webhook/route.ts`)
   - Receives webhook events
   - Updates user plan in database
   - Sends payment receipt emails
   - Handles multiple event types
   - **BUT:** Signature validation is broken

4. **Database Integration**
   - User model exists
   - Can store plan and subscription info
   - Prisma setup correct
   - **BUT:** Schema fields incomplete

5. **Plan Resource Mapping**
   - Backend has resource limits per tier
   - RAM and CPU correctly mapped
   - Used when deploying containers

---

## What's Broken ❌

### 1. Webhook Signature Verification (CRITICAL)

**File:** `web/app/api/stripe/webhook/route.ts`

**Problem:**
```typescript
// WRONG - This doesn't match Stripe signature format
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
  .update(body, 'utf8')
  .digest('hex');
```

Stripe sends signature as `t=timestamp,v1=hash`. This code produces the wrong format.

**Fix:**
```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

**Impact:** ❌ **ALL WEBHOOKS WILL FAIL** - payments received but services never deployed.

---

### 2. No Deployment Triggered (CRITICAL)

**File:** `web/app/api/stripe/webhook/route.ts`

**Problem:**
Webhook updates database but **never tells backend to deploy the service**. User pays, but their agent never starts.

**Current Code:**
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { plan: mappedPlan }
});
// ← MISSING: Call to deploy service
```

**Required Addition:**
```typescript
const deployRes = await fetch(
  `${process.env.BACKEND_API_URL}/api/subscriptions/deploy`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` },
    body: JSON.stringify({ userId, plan: mappedPlan })
  }
);
```

**Impact:** ❌ **CORE FEATURE BROKEN** - Services never deployed.

---

### 3. Missing Success Page (CRITICAL)

**File:** `web/app/checkout/success/page.tsx` (doesn't exist)

**Problem:**
After payment, redirect goes to `/onboard?paid=1` but there's no success page showing "Payment Confirmed".

**Current Behavior:**
1. User clicks "Get Started"
2. → Stripe Checkout
3. → Payment success
4. → Redirect to `/onboard?paid=1` (onboard page not configured for this)
5. → User sees generic onboarding, no confirmation

**Required:** Create success page that shows:
- ✅ Payment confirmed message
- Plan name and price
- "Go to Dashboard" button
- Next steps

**Impact:** ❌ **Poor UX** - User unsure if payment went through

---

### 4. Incomplete Database Schema (CRITICAL)

**File:** `prisma/schema.prisma`

**Problem:**
User model likely missing these fields:
- `stripeCustomerId` (needed to link Stripe customer)
- `stripeSubscriptionId` (track subscription)
- `subscriptionStatus` (active/cancelled/past_due)
- `subscriptionStartDate`
- `subscriptionEndDate`

**Impact:** ❌ **Data corruption** - Can't properly track subscriptions

---

### 5. Email System Not Configured (CRITICAL)

**File:** `web/app/api/stripe/webhook/route.ts`

**Problem:**
```typescript
import { sendEmail, sendPaymentReceiptEmail } from '../../../lib/email';
// ← This file doesn't exist!
```

Webhook tries to send emails but the email service doesn't exist.

**Impact:** ❌ **Runtime error** - Webhook crashes when sending emails

---

## Files That Need to Be Created

| File | Purpose | Status |
|------|---------|--------|
| `web/app/checkout/success/page.tsx` | Payment success page | ❌ MISSING |
| `web/app/api/stripe/verify-session/route.ts` | Verify payment session | ❌ MISSING |
| `web/app/lib/email.ts` | Email service | ❌ MISSING |
| `agentbot-backend/src/subscriptions.ts` | Deployment endpoint | ❌ MISSING |
| `prisma/migrations/xxx_add_stripe.sql` | DB schema update | ❌ MISSING |

---

## Environment Variables Needed

Add to `.env` (development) and `.env.production`:

```bash
# Stripe Test Keys (development)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx

# Stripe Live Keys (production ONLY - NOT test!)
# STRIPE_SECRET_KEY=sk_live_xxxxx
# etc.

# Price IDs (from Stripe dashboard after creating products)
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_SCALE=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
STRIPE_PRICE_WHITEGLOVE=price_xxxxx

# Email Configuration
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@agentbot.com

# Backend URL (for webhook to call deployment)
BACKEND_API_URL=http://agentbot-api:3001
INTERNAL_API_KEY=your-secret-key
```

---

## Step-by-Step Fix Guide

### Step 1: Fix Webhook Signature (30 min)

**File:** `web/app/api/stripe/webhook/route.ts`

Replace lines 7-21 with:
```typescript
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''
  
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    
    // rest of code...
```

### Step 2: Create Success Page (20 min)

Create `web/app/checkout/success/page.tsx`:
```typescript
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState('')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      router.push('/pricing?error=missing_session')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setPlan(data.plan)
        } else {
          router.push('/pricing?error=verification_failed')
          return
        }
      } catch {
        router.push('/pricing?error=verification_error')
        return
      }
      setLoading(false)
    }

    verify()
  }, [sessionId, router])

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-gray-400">Verifying payment...</div>
    </div>
  }

  const planNames: Record<string, string> = {
    'starter': 'Starter',
    'pro': 'Pro',
    'scale': 'Scale',
    'enterprise': 'Enterprise',
    'white_glove': 'White Glove'
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Payment Confirmed!</h1>
        <p className="text-gray-400 mb-2">
          Your {planNames[plan] || plan} plan is now active.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Your service will be deployed within 60 seconds.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}
```

### Step 3: Create Verification Endpoint (15 min)

Create `web/app/api/stripe/verify-session/route.ts`:
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
    console.error('Verification failed:', error)
    return NextResponse.json({ error: 'Session verification failed' }, { status: 400 })
  }
}
```

### Step 4: Add Deployment Trigger (45 min)

In webhook handler, after user update add:
```typescript
// Trigger deployment on backend
const deploymentUrl = `${process.env.BACKEND_API_URL}/api/subscriptions/deploy`
const deploymentRes = await fetch(deploymentUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
  },
  body: JSON.stringify({
    userId,
    plan: mappedPlan,
    email: customerEmail
  })
})

if (!deploymentRes.ok) {
  console.error('Deployment failed:', await deploymentRes.text())
  // Consider retry logic or queue
}
```

### Step 5: Create Email Service (30 min)

Create `web/app/lib/email.ts`:
```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@agentbot.com',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Email failed:', error)
    throw error
  }
}

export async function sendPaymentReceiptEmail(
  to: string,
  amount: number,
  plan: string
) {
  const formattedAmount = (amount / 100).toFixed(2)
  
  await sendEmail({
    to,
    subject: `AgentBot Payment Receipt - ${plan} Plan`,
    html: `
      <h1>Payment Confirmed</h1>
      <p>Thank you for upgrading to ${plan}!</p>
      <p><strong>Amount:</strong> £${formattedAmount}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><a href="https://agentbot.raveculture.xyz/dashboard">Access Dashboard</a></p>
    `,
  })
}
```

Add to dependencies:
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### Step 6: Update Database Schema (20 min)

Add to `prisma/schema.prisma`:
```prisma
model User {
  // ... existing fields ...
  
  stripeCustomerId    String?    @unique
  stripeSubscriptionId String?   @unique
  plan               String     @default("free")
  subscriptionStatus  String?
  subscriptionStartDate DateTime?
  subscriptionEndDate DateTime?
}

model WebhookEvent {
  id        String   @id @default(cuid())
  eventId   String   @unique
  type      String
  processedAt DateTime @default(now())
}
```

Run migration:
```bash
npx prisma migrate dev --name add_stripe_subscription_fields
```

### Step 7: Create Backend Deployment Endpoint (1 hr)

Add to `agentbot-backend/src/index.ts`:
```typescript
app.post('/api/subscriptions/deploy', authenticate, async (req: Request, res: Response) => {
  const { userId, plan, email } = req.body;
  
  if (!userId || !plan) {
    return res.status(400).json({ error: 'userId and plan required' });
  }

  try {
    // 1. Get user from database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Create default agent for this user
    const agentId = `agent-${userId.substring(0, 8)}`;
    const telegramToken = user.telegramToken || 'placeholder';

    // 3. Deploy via existing /api/deployments endpoint
    const deployRes = await fetch(`http://localhost:3001/api/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: JSON.stringify({
        agentId,
        config: {
          telegramToken,
          plan,
          aiProvider: 'openrouter'
        }
      })
    });

    if (!deployRes.ok) {
      throw new Error('Deployment failed');
    }

    const deployment = await deployRes.json();
    res.json({ success: true, deployment });
  } catch (error) {
    res.status(500).json({ error: 'Deployment failed' });
  }
});
```

### Step 8: Install Dependencies

```bash
npm install stripe
npm install nodemailer
npm install -D @types/nodemailer
```

---

## Testing Checklist

- [ ] Stripe test keys configured in `.env`
- [ ] Webhook signature verification passes
- [ ] Success page displays after payment
- [ ] Database updated with plan
- [ ] Email receipt received
- [ ] Backend deployment triggered
- [ ] Container deployed with correct resources
- [ ] Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Test checkout flow end-to-end
- [ ] Test all 5 plans

---

## Production Deployment

```bash
# 1. Create Stripe live products
# Dashboard: https://dashboard.stripe.com/products

# 2. Get live API keys
# Dashboard: https://dashboard.stripe.com/apikeys

# 3. Create production .env
cp .env.production .env
# Replace with LIVE keys (sk_live_xxx, pk_live_xxx)
# Get price IDs from products

# 4. Set webhook endpoint in Stripe
# Webhooks: https://dashboard.stripe.com/webhooks
# URL: https://agentbot.raveculture.xyz/api/stripe/webhook

# 5. Deploy
docker compose up -d

# 6. Verify
curl https://agentbot.raveculture.xyz/health
curl https://agentbot.raveculture.xyz/pricing
```

---

## Timeline

- **Today:** Fix 5 critical issues (4 hours)
- **Tomorrow:** Test & fix bugs (2 hours)
- **Day 3:** Create Stripe live account & products (1 hour)
- **Day 3:** Deploy to production (1 hour)

**Total:** ~8 hours until live

---

## Next Steps

1. ✅ Review this report (you're doing it now!)
2. 🔴 **Fix the 5 critical issues** (prioritized above)
3. 🧪 **Test with Stripe CLI locally**
4. 📦 **Deploy to staging first**
5. 🚀 **Deploy to production**

**Do NOT deploy until all 5 critical issues are fixed!**
