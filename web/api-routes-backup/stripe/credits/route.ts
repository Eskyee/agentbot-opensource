export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

// Allowlist of valid credit top-up price IDs (Stripe price IDs, not product IDs)
// Add additional price IDs here or configure via STRIPE_CREDIT_PRICE_IDS env var
function getAllowedPriceIds(): Set<string> {
  const envIds = (process.env.STRIPE_CREDIT_PRICE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  return new Set(envIds)
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    return NextResponse.redirect(new URL(`/billing?error=unauthorized`, origin), 303)
  }

  const priceId = request.nextUrl.searchParams.get('price') || ''
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    return NextResponse.redirect(new URL(`/billing?error=stripe_not_configured`, origin), 303)
  }

  if (!priceId) {
    return NextResponse.redirect(new URL(`/billing?error=invalid_price`, origin), 303)
  }

  // Validate priceId against allowlist to prevent arbitrary Stripe price abuse
  const allowedPriceIds = getAllowedPriceIds()
  if (allowedPriceIds.size > 0 && !allowedPriceIds.has(priceId)) {
    return NextResponse.redirect(new URL(`/billing?error=invalid_price`, origin), 303)
  }

  try {
    const stripe = new Stripe(stripeKey)
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?payment_cancelled=1`,
      metadata: {
        type: 'credits',
        source: 'agentbot-web',
      },
    })

    if (!session.url) {
      return NextResponse.redirect(new URL(`/billing?error=no_checkout_url`, origin), 303)
    }

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Stripe credits checkout error:', errorMessage)
    return NextResponse.redirect(new URL(`/billing?error=checkout_failed`, origin), 303)
  }
}
