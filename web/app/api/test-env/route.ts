import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const starterPrice = process.env.STRIPE_PRICE_ID_STARTER
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  
  return NextResponse.json({
    hasStripeKey: !!stripeKey,
    stripeKeyPrefix: stripeKey?.substring(0, 8),
    starterPrice,
    appUrl,
    envCount: Object.keys(process.env).filter(k => k.startsWith('STRIPE')).length,
  })
}
