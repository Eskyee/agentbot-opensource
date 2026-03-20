export const dynamic = "force-static"
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/app/lib/stripe'
import { PRICING_TIERS } from '@/app/lib/pricing'
import { alertStripeFailure, sendAlert } from '@/app/lib/alerts'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

async function deployAgentService(tier: string, customerId: string, subscriptionId: string) {
  try {
    // Call backend to deploy service
    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/subscriptions/deploy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
        },
        body: JSON.stringify({
          tier,
          customerId,
          subscriptionId,
          stripeCustomerId: customerId,
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to deploy service')
    }

    return await response.json()
  } catch (error) {
    console.error('Deployment error:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature') || ''

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const customerId = session.customer
        const metadata = session.metadata || {}
        const tier = metadata.tierId

        if (!tier || !customerId) {
          console.error('Missing tier or customerId in session')
          break
        }

        // Deploy service
        try {
          await deployAgentService(tier, customerId, session.subscription as string)
          console.log(`Service deployed for customer ${customerId} on tier ${tier}`)
        } catch (error) {
          console.error('Failed to deploy service:', error)
          // Still return 200 to Stripe - we'll retry via webhook
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        console.log(`Subscription updated for customer ${subscription.customer}`)
        // Handle tier upgrades/downgrades
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        console.log(`Payment succeeded for customer ${invoice.customer}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        console.log(`Payment failed for customer ${invoice.customer}`)
        // Alert ops team
        await alertStripeFailure(
          'invoice.payment_failed',
          String(invoice.customer),
          invoice.amount_due ? `£${(invoice.amount_due / 100).toFixed(2)}` : undefined
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        console.log(`Subscription cancelled for customer ${subscription.customer}`)
        await sendAlert({
          title: 'Subscription Cancelled',
          message: 'A customer cancelled their subscription.',
          severity: 'warning',
          fields: { Customer: String(subscription.customer), Plan: String(subscription.items?.data?.[0]?.plan?.nickname || 'unknown') },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
