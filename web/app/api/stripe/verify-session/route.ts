import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return NextResponse.json({
      plan: session.metadata?.plan || 'unknown',
      status: session.payment_status,
      customer_email: session.customer_details?.email
    })
  } catch (error) {
    console.error('Session verification failed:', error)
    return NextResponse.json({ error: 'Session verification failed' }, { status: 400 })
  }
}
