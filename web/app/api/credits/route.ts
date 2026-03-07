import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Credits API - STUBBED
 * Will show user credit balance once database is integrated
 * 
 * TODO: Implement database layer
 * - Track credit purchases from Stripe
 * - Deduct credits from operations
 * - Display balance to user
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // STUBBED: Return hardcoded response until DB is ready
  return NextResponse.json({
    credits: 1000,
    tier: 'starter',
    message: 'Credits system coming soon - database integration pending',
    lastUpdated: new Date().toISOString()
  })
}
