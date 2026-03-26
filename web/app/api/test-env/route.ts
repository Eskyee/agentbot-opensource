import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}

export async function GET(request: NextRequest) {
  // Admin-only
  const session = await getAuthSession()
  if (!session?.user?.email || !isAdmin(session.user.email)) {
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


export const dynamic = 'force-dynamic';