import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import Stripe from 'stripe'

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  solo: { amount: 2900, name: 'Solo' },
  collective: { amount: 6900, name: 'Collective' },
  label: { amount: 14900, name: 'Label' },
  network: { amount: 49900, name: 'Network' },
}

// No fallback prices - always create dynamically to avoid stale IDs

export async function GET(request: NextRequest) {
  const plan = (request.nextUrl.searchParams.get('plan') || '').toLowerCase()
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  const validPlans = ['solo', 'collective', 'label', 'network']
  if (!validPlans.includes(plan)) {
    return NextResponse.redirect(new URL(`/pricing?error=invalid_plan`, origin), 303)
  }

  const session = await getAuthSession()
  const userId = session?.user?.id || ''
  const userEmail = session?.user?.email || ''

  // Admin bypass — skip Stripe, go straight to onboard
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
    return NextResponse.redirect(new URL(`/onboard?plan=${plan}&paid=1&admin=1`, origin), 303)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    console.error('Stripe secret key not configured')
    return NextResponse.redirect(new URL(`/pricing?error=stripe_not_configured`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    const planInfo = PLAN_PRICES[plan]
    
    let priceId: string
    
    // Try to find existing price in Stripe
    try {
      let allPrices: Stripe.Price[] = []
      let lastId: string | undefined
      do {
        const resp = await stripe.prices.list({
          active: true,
          currency: 'gbp',
          limit: 100,
          starting_after: lastId,
        })
        allPrices = allPrices.concat(resp.data)
        lastId = resp.has_more ? resp.data[resp.data.length - 1].id : undefined
      } while (lastId)

      const foundPrice = allPrices.find(p =>
        p.recurring?.interval === 'month' &&
        p.unit_amount === planInfo.amount &&
        p.active === true
      )

      if (foundPrice) {
        priceId = foundPrice.id
      } else {
        // Create new product and price
        let productId: string | undefined
        let lastProductId: string | undefined
        do {
          const resp = await stripe.products.list({
            active: true,
            limit: 100,
            starting_after: lastProductId,
          })
          const match = resp.data.find(p => p.name === planInfo.name && p.active)
          if (match) {
            productId = match.id
            break
          }
          lastProductId = resp.has_more ? resp.data[resp.data.length - 1].id : undefined
        } while (!productId && lastProductId)

        if (!productId) {
          const normalized = planInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
          const productKey = `product_${normalized}`
          const newProduct = await stripe.products.create(
            { name: planInfo.name, active: true },
            { idempotencyKey: productKey }
          )
          productId = newProduct.id
        }

        const priceKey = `price_gbp_${planInfo.amount}_month`
        const newPrice = await stripe.prices.create(
          {
            unit_amount: planInfo.amount,
            currency: 'gbp',
            recurring: { interval: 'month' },
            product: productId,
            active: true,
          },
          { idempotencyKey: priceKey }
        )
        priceId = newPrice.id
      }
    } catch (stripeError) {
      // Re-throw Stripe API errors - let user see the error
      console.error('Stripe API error:', stripeError)
      throw stripeError
    }
    
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/pricing?cancelled=1`,
      metadata: { plan, source: 'agentbot-web', userId },
      subscription_data: {
        trial_period_days: 7,
      },
    }
    // Pre-fill customer email if logged in — improves conversion
    if (userEmail) {
      checkoutParams.customer_email = userEmail
    }
    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams)

    if (!checkoutSession.url) {
      return NextResponse.redirect(new URL(`/pricing?error=no_checkout_url`, origin), 303)
    }

    // Always redirect to Stripe — works for both <a href> links and programmatic navigation
    return NextResponse.redirect(checkoutSession.url, 303)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Stripe checkout error:', errorMessage, { plan })
    return NextResponse.redirect(new URL(`/pricing?error=checkout_failed`, origin), 303)
  }
}


export const dynamic = 'force-dynamic';