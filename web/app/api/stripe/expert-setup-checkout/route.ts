import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const EXPERT_SETUP_PRICE = 4900 // £49 in pence

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') || ''
  const time = request.nextUrl.searchParams.get('time') || ''
  const email = request.nextUrl.searchParams.get('email') || ''
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (!date || !time || !email) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(stripeKey)

    // Create or find the Expert Setup product
    let productId: string | undefined
    const products = await stripe.products.list({ active: true, limit: 10 })
    const existingProduct = products.data.find(p => p.name === 'Expert Setup Session')
    
    if (existingProduct) {
      productId = existingProduct.id
    } else {
      const newProduct = await stripe.products.create({
        name: 'Expert Setup Session',
        description: '1-hour live configuration session with Agentbot team',
        active: true,
      })
      productId = newProduct.id
    }

    // Create or find the price
    let priceId: string | undefined
    const prices = await stripe.prices.list({ active: true, product: productId, limit: 10 })
    const existingPrice = prices.data.find(p => p.unit_amount === EXPERT_SETUP_PRICE && p.currency === 'gbp')
    
    if (existingPrice) {
      priceId = existingPrice.id
    } else {
      const newPrice = await stripe.prices.create({
        unit_amount: EXPERT_SETUP_PRICE,
        currency: 'gbp',
        product: productId,
        active: true,
      })
      priceId = newPrice.id
    }

    // Create checkout session (one-time payment, not subscription)
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${origin}/expert-setup/success?date=${date}&time=${time}`,
      cancel_url: `${origin}/expert-setup?cancelled=1`,
      metadata: {
        date,
        time,
        type: 'expert-setup',
      },
    })

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Expert setup checkout error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'