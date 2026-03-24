/**
 * Google Calendar OAuth Callback
 * 
 * Google redirects here after user authorizes.
 * Exchanges the auth code for tokens and stores them.
 */

import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://agentbot.raveculture.xyz/api/calendar/callback'

// In-memory store (shared with main calendar route)
// In production: use Redis/Postgres
const userCalendars = new Map<string, any>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // userId
  const error = searchParams.get('error')

  if (error) {
    console.error('[Calendar Callback] OAuth error:', error)
    return NextResponse.redirect(`https://agentbot.raveculture.xyz/dashboard/calendar?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect('https://agentbot.raveculture.xyz/dashboard/calendar?error=no_code')
  }

  try {
    // Exchange code for tokens
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
      return NextResponse.redirect(`https://agentbot.raveculture.xyz/dashboard/calendar?error=token_failed`)
    }

    // Get calendar info
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList/primary', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    })
    const calendarData = await calendarResponse.json()

    // Get timezone
    const timezoneResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/settings/timezone', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    })
    const timezoneData = await timezoneResponse.json()

    // Store tokens (in production: persist to DB linked to userId)
    const userId = state || 'default'
    userCalendars.set(userId, {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      calendarId: calendarData.id || 'primary',
      timezone: timezoneData.value || 'UTC',
    })

    console.log(`[Calendar] Connected for user ${userId}: ${calendarData.summary} (${timezoneData.value})`)

    // Redirect to calendar page with success
    return NextResponse.redirect(`https://agentbot.raveculture.xyz/dashboard/calendar?connected=true`)
  } catch (err) {
    console.error('[Calendar Callback] Error:', err)
    return NextResponse.redirect(`https://agentbot.raveculture.xyz/dashboard/calendar?error=unknown`)
  }
}
