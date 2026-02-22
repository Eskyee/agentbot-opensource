import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID_STARTER
  
  const debug = {
    hasStripeKey: !!stripeKey,
    stripeKeyPrefix: stripeKey?.substring(0, 8),
    priceId,
    priceIdSet: !!priceId,
  }

  if (!stripeKey || !priceId) {
    return NextResponse.json({ ...debug, error: 'Missing stripe key or price ID' }, { status: 400 })
  }

  try {
    const stripe = new Stripe(stripeKey)
    
    // Try to retrieve the price first to verify it exists
    const price = await stripe.prices.retrieve(priceId)
    
    // Try to create a checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboard?paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboard?cancelled=1`,
    })

    return NextResponse.json({
      ...debug,
      priceActive: price.active,
      priceUnitAmount: price.unit_amount,
      sessionCreated: !!session.id,
      sessionUrl: session.url?.substring(0, 50) + '...',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.constructor.name : 'Unknown'
    
    return NextResponse.json({
      ...debug,
      error: errorMessage,
      errorType,
    }, { status: 500 })
  }
}
