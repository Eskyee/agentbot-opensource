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


export const dynamic = 'force-dynamic';