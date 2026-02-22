import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
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
