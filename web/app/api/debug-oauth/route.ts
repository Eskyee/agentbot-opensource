import { NextRequest, NextResponse } from 'next/server'

const DEBUG_SECRET = process.env.DEBUG_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!DEBUG_SECRET || authHeader !== `Bearer ${DEBUG_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
  const hasGitHubClientId = !!process.env.GITHUB_CLIENT_ID
  const hasGitHubClientSecret = !!process.env.GITHUB_CLIENT_SECRET
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL

  return NextResponse.json({
    google: {
      hasClientId: hasGoogleClientId,
      clientIdPrefix: hasGoogleClientId ? process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...' : null,
      hasClientSecret: hasGoogleClientSecret,
    },
    github: {
      hasClientId: hasGitHubClientId,
      clientIdPrefix: hasGitHubClientId ? process.env.GITHUB_CLIENT_ID?.substring(0, 8) + '...' : null,
      hasClientSecret: hasGitHubClientSecret,
    },
    nextauth: {
      hasSecret: hasNextAuthSecret,
      hasUrl: hasNextAuthUrl,
      url: process.env.NEXTAUTH_URL,
    }
  })
}
