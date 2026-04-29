import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/app/lib/stripe'
import { prisma } from '@/app/lib/prisma'
import { alertStripeFailure, sendAlert } from '@/app/lib/alerts'
import { sendPaymentReceiptEmail } from '@/app/lib/email'
import { signedFetch } from '@/app/lib/backend-client'

// Fail closed: guard at module load
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
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

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const customerEmail = session.customer_details?.email || session.customer_email
        const userId = session.metadata?.userId
        const stripeCustomerId = session.customer as string | null || null
        const stripeSubscriptionId = session.subscription as string || null
        const plan = session.metadata?.plan || session.metadata?.tierId || 'solo'
        const mappedPlan = planMap[plan] || 'solo'
        const amount = session.amount_total || 0

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
              } catch (emailErr) {
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
          // No userId in metadata — update existing user by email only (never create)
          // Creating a new user here risks duplicate accounts if metadata is missing
          console.warn(`[Webhook] No userId in metadata, falling back to email update only: ${customerEmail}`)
          try {
            await prisma.user.update({
              where: { email: customerEmail },
              data: subscriptionData,
            })
            console.log(`[Webhook] Updated user by email ${customerEmail} to plan ${mappedPlan}`)
            await sendPaymentReceiptEmail(customerEmail, amount, mappedPlan)
          } catch (err) {
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

        // Ad campaign payment confirmed
        if (session.metadata?.type === 'ad_campaign' && session.metadata?.campaignId) {
          const campaignId = session.metadata.campaignId
          const paymentId  = typeof session.payment_intent === 'string' ? session.payment_intent : null
          try {
            await prisma.ad_campaigns.update({
              where: { id: campaignId },
              data:  {
                status:            'paid',
                stripe_payment_id: paymentId,
              },
            })
            console.log(`[Webhook] Ad campaign ${campaignId} marked paid`)
            await sendAlert({
              title:    '💰 Ad Campaign Paid',
              message:  `Campaign ${campaignId} payment confirmed. Review and approve in /admin/ads.`,
              severity: 'info',
              fields: {
                Campaign:  campaignId,
                Amount:    `£${((session.amount_total ?? 0) / 100).toFixed(2)}`,
                Advertiser: session.customer_details?.email ?? 'unknown',
              },
            }).catch(() => null)
          } catch (err) {
            console.error(`[Webhook] Failed to update ad campaign ${campaignId}:`, err)
          }
        }

        // Storage upgrades
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

        // Trigger managed agent deployment if this was a new subscription
        if (userId && mappedPlan !== 'free') {
          console.log(`[Webhook] Triggering auto-provision for user ${userId}`);
          signedFetch('/api/provision', {
            method: 'POST',
            body: JSON.stringify({
              userId,
              plan: mappedPlan,
              autoProvision: true,
              stripeSubscriptionId,
            }),
          }).catch(err => console.error('[Webhook] Auto-provision trigger failed:', err));
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const customerEmail = invoice.customer_email
        if (customerEmail) {
          await sendPaymentReceiptEmail(customerEmail, invoice.amount_paid, 'Subscription renewal')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        console.error(`[Webhook] Payment failed for customer ${invoice.customer}`)
        // Update user status if we can find them
        if (invoice.customer_email) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: invoice.customer },
            data: { subscriptionStatus: 'past_due' },
          }).catch(() => {})
        }
        await alertStripeFailure(
          'invoice.payment_failed',
          String(invoice.customer),
          invoice.amount_due ? `£${(invoice.amount_due / 100).toFixed(2)}` : undefined
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        console.log(`[Webhook] Subscription cancelled: ${subscription.customer}`)
        await prisma.user.updateMany({
          where: { stripeCustomerId: subscription.customer },
          data: { subscriptionStatus: 'cancelled', plan: 'free' },
        }).catch(() => {})
        break
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
