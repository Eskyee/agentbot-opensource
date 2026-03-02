import { NextResponse } from 'next/server'
import { createCheckoutSession, stripe, createCustomer } from '@/app/lib/stripe'
import { PRICING_TIERS } from '@/app/lib/pricing'

export async function POST(request: Request) {
  try {
    const { tierId, email } = await request.json()

    if (!tierId) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 })
    }

    const tier = PRICING_TIERS[tierId as keyof typeof PRICING_TIERS]
    if (!tier || !tier.stripePriceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Create customer if email provided
    let customerId: string | undefined
    if (email) {
      try {
        const customer = await createCustomer(email)
        customerId = customer.id
      } catch (error) {
        console.error('Failed to create customer:', error)
      }
    }

    // Create checkout session
    const session = await createCheckoutSession(tier.stripePriceId, customerId, {
      tierId,
      tierName: tier.name,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
