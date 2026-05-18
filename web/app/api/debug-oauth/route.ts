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

  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL

  return NextResponse.json({
    google: {
      hasClientId: hasGoogleClientId,
      // Never leak prefixes — just boolean flags
      hasClientSecret: hasGoogleClientSecret,
    },
    nextauth: {
      hasSecret: hasNextAuthSecret,
      hasUrl: hasNextAuthUrl,
      url: process.env.NEXTAUTH_URL,
    }
  })
}


