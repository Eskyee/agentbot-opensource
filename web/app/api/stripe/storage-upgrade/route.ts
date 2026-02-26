import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(stripeKey)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Extra Storage (50 GB)',
              description: 'Add 50 GB of cloud storage for your agent files',
            },
            unit_amount: 499, // £4.99
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/files?upgrade=success`,
      cancel_url: `${origin}/dashboard/files?upgrade=cancelled`,
      metadata: {
        userEmail: session.user.email,
        type: 'storage_upgrade',
        storageGB: '50',
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Storage upgrade checkout error:', errorMessage)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
