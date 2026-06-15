import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { getGlobalFlags } from '@/app/lib/feature-flags'

export async function GET(request: NextRequest) {
  if (!getGlobalFlags().debugRoutesEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Admin-only
  const session = await getAuthSession()
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    // Never expose key prefixes — boolean only
    starterPrice: process.env.STRIPE_PRICE_ID_STARTER ? 'set' : 'missing',
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    envCount: Object.keys(process.env).filter(k => k.startsWith('STRIPE')).length,
  })
}


