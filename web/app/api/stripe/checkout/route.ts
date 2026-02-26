import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PLAN_PRICES: Record<string, { amount: number; name: string; description: string }> = {
  starter: { amount: 1900, name: 'Starter Plan', description: '1 AI Agent, 10GB storage, Telegram channel' },
  pro: { amount: 3900, name: 'Pro Plan', description: '1 AI Agent, 50GB storage, Telegram + WhatsApp, Custom domain, + usage' },
  scale: { amount: 7900, name: 'Scale Plan', description: '3 AI Agents, 100GB storage, All channels, Advanced analytics' },
  enterprise: { amount: 14900, name: 'Enterprise Plan', description: 'Unlimited agents, 500GB storage, White-label, 24/7 support' },
  white_glove: { amount: 19900, name: 'White Glove Plan', description: 'Premium - Everything in Enterprise, 10x resources, Dedicated account manager' },
}

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  
  const validPlans = ['starter', 'pro', 'scale', 'enterprise', 'white_glove']
  if (!validPlans.includes(plan)) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=invalid_plan`, origin), 303)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=stripe_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    
    const planInfo = PLAN_PRICES[plan]
    
    // Check for env var price ID first
    let priceId = process.env[`STRIPE_PRICE_ID_${plan.toUpperCase()}`]
    
    // If no env price ID, try to find existing price or create new
    if (!priceId) {
      const existingPrices = await stripe.prices.list({ 
        active: true, 
        limit: 100 
      })
      const foundPrice = existingPrices.data.find(p => 
        p.recurring?.interval === 'month' && 
        p.unit_amount === planInfo.amount
      )
      
      if (foundPrice) {
        priceId = foundPrice.id
      } else {
        // Create new price with product
        const products = await stripe.products.list({ active: true, limit: 10 })
        let productId = products.data.find(p => p.name === planInfo.name)?.id
        
        if (!productId) {
          const newProduct = await stripe.products.create({
            name: planInfo.name,
          })
          productId = newProduct.id
        }
        
        const newPrice = await stripe.prices.create({
          unit_amount: planInfo.amount,
          currency: 'gbp',
          recurring: { interval: 'month' },
          product: productId,
        })
        priceId = newPrice.id
      }
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/onboard?plan=${plan}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/onboard?plan=${plan}&payment_cancelled=1`,
      metadata: {
        plan,
        source: 'agentbot-web',
      },
    })

    if (!session.url) {
      return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=no_checkout_url`, origin), 303)
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', errorMessage, { plan })
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&payment_error=${encodeURIComponent(errorMessage)}`, origin), 303)
  }
}
