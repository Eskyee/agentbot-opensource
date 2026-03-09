import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL

  return NextResponse.json({
    google: {
      hasClientId: hasGoogleClientId,
      clientIdPrefix: hasGoogleClientId ? process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...' : null,
      hasClientSecret: hasGoogleClientSecret,
    },
    nextauth: {
      hasSecret: hasNextAuthSecret,
      hasUrl: hasNextAuthUrl,
      url: process.env.NEXTAUTH_URL,
    }
  })
}
