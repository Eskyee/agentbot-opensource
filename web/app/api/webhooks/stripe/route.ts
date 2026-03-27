import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/app/lib/stripe'
import { prisma } from '@/app/lib/prisma'
import { alertStripeFailure, sendAlert } from '@/app/lib/alerts'
import { sendPaymentReceiptEmail } from '@/app/lib/email'

// Fail closed: guard at module load
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  console.error('[SECURITY] STRIPE_WEBHOOK_SECRET not configured — Stripe webhooks will be rejected')
}

const planMap: Record<string, string> = {
  underground: 'solo',  // legacy name → map to solo
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
            console.error(`[Webhook] Failed to update by userId, trying email:`, err)
            if (customerEmail) {
              await prisma.user.upsert({
                where: { email: customerEmail },
                update: subscriptionData,
                create: { email: customerEmail, ...subscriptionData },
              })
              await sendPaymentReceiptEmail(customerEmail, amount, mappedPlan)
            }
          }
        } else if (customerEmail) {
          // No userId — fall back to email
          console.log(`[Webhook] No userId, falling back to email: ${customerEmail}`)
          try {
            await prisma.user.update({
              where: { email: customerEmail },
              data: subscriptionData,
            })
            console.log(`[Webhook] Updated user by email ${customerEmail} to plan ${mappedPlan}`)
            await sendPaymentReceiptEmail(customerEmail, amount, mappedPlan)
          } catch (err) {
            console.error(`[Webhook] No user found for email ${customerEmail} — creating new user`)
            try {
              await prisma.user.create({
                data: { email: customerEmail, ...subscriptionData },
              })
              console.log(`[Webhook] Created new user for ${customerEmail}`)
              await sendPaymentReceiptEmail(customerEmail, amount, mappedPlan)
            } catch (createErr) {
              console.error(`[Webhook] Failed to create user:`, createErr)
            }
          }
        } else {
          console.error('[Webhook] No userId or email in checkout session!')
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
