import { NextResponse, after } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe } from '@/app/lib/stripe'
import { prisma } from '@/app/lib/prisma'
import { alertStripeFailure, sendAlert } from '@/app/lib/alerts'
import { sendPaymentReceiptEmail } from '@/app/lib/email'
import { signedFetch } from '@/app/lib/backend-client'
import { isStaticBuildPhase } from '@/app/lib/build-phase'

// Fail closed: guard at module load
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret && !isStaticBuildPhase()) {
  console.error('[SECURITY] STRIPE_WEBHOOK_SECRET not configured — Stripe webhooks will be rejected')
}

const planMap: Record<string, string> = {
  autonomous: 'solo',  // legacy name → map to solo
  solo:        'solo',
  collective:  'collective',
  label:       'label',
  network:     'network',
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature') || ''

    if (!webhookSecret) {
      console.error('[SECURITY] Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Idempotency-first: claim the event by inserting now, before any side effects.
    // - Stripe retries on 5xx, so we still get retried if this insert fails.
    // - On unique-constraint violation we know we've already processed this event
    //   and can return 200 immediately without re-running side effects.
    // - Once we own the row, we return 200 to Stripe and run side effects deferred
    //   via after(), so Stripe's 30s retry budget never has to wait for our DB +
    //   email + provision-enqueue work.
    try {
      await prisma.processedStripeEvent.create({
        data: { eventId: event.id, type: event.type },
      })
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code
      if (code === 'P2002') {
        console.log(`[Webhook] Duplicate event ${event.id} (${event.type}) — already processed, skipping`)
        return NextResponse.json({ received: true, deduped: true })
      }
      console.error('[Webhook] Failed to claim event for idempotency:', err)
      return NextResponse.json({ error: 'Idempotency store unavailable' }, { status: 503 })
    }

    after(() => processStripeEvent(event))

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Runs after the 200 has been sent to Stripe. We've already claimed the event
 * via processedStripeEvent.create(); failures here will NOT be retried by
 * Stripe, so we surface them via sendAlert for manual reconciliation.
 */
async function processStripeEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event)
        break

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { customer_email?: string | null; amount_paid?: number }
        const customerEmail = invoice.customer_email
        if (customerEmail) {
          await sendPaymentReceiptEmail(customerEmail, invoice.amount_paid ?? 0, 'Subscription renewal')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          customer_email?: string | null
          customer?: string | null
          amount_due?: number | null
        }
        console.error(`[Webhook] Payment failed for customer ${invoice.customer}`)
        if (invoice.customer_email && invoice.customer) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: invoice.customer },
            data: { subscriptionStatus: 'past_due' },
          }).catch(() => {})
        }
        await alertStripeFailure(
          'invoice.payment_failed',
          String(invoice.customer ?? ''),
          invoice.amount_due ? `£${(invoice.amount_due / 100).toFixed(2)}` : undefined
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription & { customer?: string | null }
        console.log(`[Webhook] Subscription cancelled: ${subscription.customer}`)
        if (subscription.customer) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: String(subscription.customer) },
            data: { subscriptionStatus: 'cancelled', plan: 'free' },
          }).catch(() => {})
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event.type}`)
    }
  } catch (err: unknown) {
    // We've already returned 200, so Stripe won't retry. Alert so the failure
    // is visible and can be reconciled manually (or via a future retry worker).
    console.error('[Webhook] Deferred processing failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    await sendAlert({
      title: 'Stripe Webhook Processing Failed',
      message: `Event ${event.id} (${event.type}) failed during deferred processing.`,
      severity: 'critical',
      fields: { EventId: event.id, Type: event.type, Error: message.slice(0, 500) },
    }).catch(() => null)
  }
}

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session & {
    customer_details?: { email?: string | null } | null
    customer_email?: string | null
    metadata?: Record<string, string | undefined> | null
    payment_intent?: string | null
    amount_total?: number | null
  }

  const customerEmail = session.customer_details?.email || session.customer_email
  const userId = session.metadata?.userId
  const stripeCustomerId = (typeof session.customer === 'string' ? session.customer : null) || null
  const stripeSubscriptionId = (typeof session.subscription === 'string' ? session.subscription : null) || null
  const plan = session.metadata?.plan || session.metadata?.tierId || 'solo'
  const mappedPlan = planMap[plan] || 'solo'
  const amount = session.amount_total ?? 0

  const subscriptionData = {
    plan: mappedPlan,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionStatus: 'active' as const,
    subscriptionStartDate: new Date(),
  }

  if (userId && userId.trim() !== '') {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: subscriptionData,
      })
      console.log(`[Webhook] Updated user ${userId} to plan ${mappedPlan}`)
      if (customerEmail) {
        await sendPaymentReceiptEmail(customerEmail, amount, mappedPlan)
      }
    } catch (err) {
      console.error(`[Webhook] Failed to update by userId ${userId}, trying email:`, err)
      if (customerEmail) {
        // Update only — never create. Creating a new user here risks duplicate
        // accounts when the userId in metadata is stale or incorrect.
        try {
          await prisma.user.update({
            where: { email: customerEmail },
            data: subscriptionData,
          })
          console.log(`[Webhook] Updated user by email ${customerEmail} to plan ${mappedPlan}`)
          await sendPaymentReceiptEmail(customerEmail, amount, mappedPlan)
        } catch {
          console.error(`[Webhook] No user found for email ${customerEmail} — skipping to avoid duplicate account`)
          await sendAlert({
            title: 'Stripe Webhook Issue',
            message: `userId ${userId} not found and no user with email ${customerEmail} — skipping to avoid duplicate account.`,
            severity: 'warning',
            fields: { UserId: userId, Email: customerEmail, Issue: 'userId update failed, email fallback also failed' },
          })
        }
      }
    }
  } else if (customerEmail) {
    console.warn(`[Webhook] No userId in metadata, falling back to email update only: ${customerEmail}`)
    try {
      await prisma.user.update({
        where: { email: customerEmail },
        data: subscriptionData,
      })
      console.log(`[Webhook] Updated user by email ${customerEmail} to plan ${mappedPlan}`)
      await sendPaymentReceiptEmail(customerEmail, amount, mappedPlan)
    } catch {
      console.error(`[Webhook] No user found for email ${customerEmail} — skipping to avoid duplicate account`)
      await sendAlert({
        title: 'Stripe Webhook Issue',
        message: `No user found for ${customerEmail} — skipping to avoid duplicate account.`,
        severity: 'warning',
        fields: { Email: customerEmail, Issue: 'userId missing from metadata' },
      })
    }
  } else {
    console.error('[Webhook] No userId or email in checkout session!')
  }

  if (session.metadata?.type === 'ad_campaign' && session.metadata?.campaignId) {
    const campaignId = session.metadata.campaignId
    const paymentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
    try {
      await prisma.ad_campaigns.update({
        where: { id: campaignId },
        data: {
          status: 'paid',
          stripe_payment_id: paymentId,
        },
      })
      console.log(`[Webhook] Ad campaign ${campaignId} marked paid`)
      await sendAlert({
        title: '💰 Ad Campaign Paid',
        message: `Campaign ${campaignId} payment confirmed. Review and approve in /admin/ads.`,
        severity: 'info',
        fields: {
          Campaign: campaignId,
          Amount: `£${((session.amount_total ?? 0) / 100).toFixed(2)}`,
          Advertiser: session.customer_details?.email ?? 'unknown',
        },
      }).catch(() => null)
    } catch (err) {
      console.error(`[Webhook] Failed to update ad campaign ${campaignId}:`, err)
    }
  }

  if (session.metadata?.type === 'storage_upgrade' && session.metadata?.userId) {
    const storageGB = 50
    const user = await prisma.user.update({
      where: { id: session.metadata.userId },
      data: { storageLimit: { increment: storageGB } },
    }).catch(() => null)
    if (user?.email) {
      console.log(`[Webhook] Storage upgrade +${storageGB}GB for ${user.email}`)
    }
  }

  if (userId && mappedPlan !== 'free') {
    console.log(`[Webhook] Triggering auto-provision for user ${userId}`)
    signedFetch('/api/provision', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        plan: mappedPlan,
        autoProvision: true,
        stripeSubscriptionId,
      }),
    }).catch((err) => console.error('[Webhook] Auto-provision trigger failed:', err))
  }
}
