/**
 * Google Calendar OAuth Callback — SECURED + PERSISTENT
 *
 * Verifies HMAC-signed state parameter. Stores tokens encrypted in Prisma.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyOAuthState } from '../route'
import { prisma } from '@/app/lib/prisma'
import { encryptToken } from '@/app/lib/token-encryption'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://agentbot.raveculture.xyz/api/calendar/callback'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('[Calendar Callback] OAuth error:', error)
    return NextResponse.redirect(`https://agentbot.raveculture.xyz/dashboard/calendar?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect('https://agentbot.raveculture.xyz/dashboard/calendar?error=no_code')
  }

  if (!state) {
    console.error('[Calendar Callback] Missing state parameter')
    return NextResponse.redirect('https://agentbot.raveculture.xyz/dashboard/calendar?error=missing_state')
  }

  const stateData = verifyOAuthState(state)
  if (!stateData) {
    console.error('[Calendar Callback] Invalid or expired state — rejecting')
    return NextResponse.redirect('https://agentbot.raveculture.xyz/dashboard/calendar?error=invalid_state')
  }

  const userId = stateData.userId

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      console.error('[Calendar Callback] Token exchange error:', tokens.error)
      return NextResponse.redirect('https://agentbot.raveculture.xyz/dashboard/calendar?error=token_failed')
    }

    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList/primary', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    })
    const calendarData = await calendarResponse.json()

    const timezoneResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/settings/timezone', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    })
    const timezoneData = await timezoneResponse.json()

    // Persist tokens encrypted to database
    await prisma.calendarToken.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        calendarId: calendarData.id || 'primary',
        timezone: timezoneData.value || 'UTC',
      },
      update: {
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token || ''),
        calendarId: calendarData.id || 'primary',
        timezone: timezoneData.value || 'UTC',
        updatedAt: new Date(),
      },
    })

    console.log(`[Calendar] Connected for user ${userId}: ${calendarData.summary} (${timezoneData.value})`)
    return NextResponse.redirect('https://agentbot.raveculture.xyz/dashboard/calendar?connected=true')
  } catch (err) {
    console.error('[Calendar Callback] Error:', err)
    return NextResponse.redirect('https://agentbot.raveculture.xyz/dashboard/calendar?error=unknown')
  }
}
