/**
 * Google Calendar API — SECURED
 *
 * All routes require NextAuth session. userId is derived from session,
 * NEVER from client input. OAuth state is HMAC-signed to prevent forgery.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://agentbot.raveculture.xyz/api/calendar/callback';
const OAUTH_STATE_SECRET = process.env.CALENDAR_OAUTH_SECRET || process.env.NEXTAUTH_SECRET || 'calendar-state-fallback';

// In-memory token store — keyed by authenticated user ID from session
// In production: persist to DB with encryption
const userCalendars = new Map<string, {
  userId: string;
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  timezone: string;
}>();

// Export for callback route to access
export { userCalendars };

// --- Helpers ---

function signOAuthState(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', OAUTH_STATE_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyOAuthState(state: string): { userId: string; ts: number } | null {
  try {
    const [payload, sig] = state.split('.');
    const expected = crypto.createHmac('sha256', OAUTH_STATE_SECRET).update(payload).digest('base64url');
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    // State expires after 10 minutes
    if (Date.now() - data.ts > 10 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

async function callGoogleCalendarApi(accessToken: string, endpoint: string, method = 'GET', body?: object) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json();
}

function generateAvailableSlots(date: string, busySlots: { start: string; end: string }[]) {
  const slots = [];
  for (let hour = 9; hour < 23; hour++) {
    const slotStart = `${date}T${hour.toString().padStart(2, '0')}:00:00`;
    const slotEnd = `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`;
    const isBusy = busySlots.some(busy => slotStart < busy.end && slotEnd > busy.start);
    if (!isBusy) slots.push({ start: slotStart, end: slotEnd });
  }
  return slots;
}

// --- Routes ---

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // AUTH: Start OAuth flow — requires session
  if (action === 'auth') {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // HMAC-signed state binds OAuth callback to this user
    const state = signOAuthState(session.user.id);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
    return NextResponse.redirect(authUrl);
  }

  // LIST events — requires session, uses session userId
  if (action === 'list') {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const calendar = userCalendars.get(session.user.id);
    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 401 });
    }

    const start = searchParams.get('start') || new Date().toISOString();
    const end = searchParams.get('end') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const events = await callGoogleCalendarApi(
      calendar.accessToken,
      `/calendars/${calendar.calendarId}/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`
    );

    return NextResponse.json({ events: events.items || [], timezone: calendar.timezone });
  }

  // AVAILABILITY — requires session
  if (action === 'availability') {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const calendar = userCalendars.get(session.user.id);
    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 401 });
    }

    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startOfDay = `${date}T09:00:00`;
    const endOfDay = `${date}T23:00:00`;

    const events = await callGoogleCalendarApi(
      calendar.accessToken,
      `/calendars/${calendar.calendarId}/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true`
    );

    const busySlots = (events.items || []).map((e: any) => ({
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date
    }));

    const availableSlots = generateAvailableSlots(date, busySlots);
    return NextResponse.json({ availableSlots, busySlots, date });
  }

  return NextResponse.json({
    message: 'Calendar API',
    actions: ['auth', 'list', 'availability']
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;
    const userId = session.user.id; // ALWAYS from session, never from body
    const calendar = userCalendars.get(userId);

    if (action === 'connect') {
      const state = signOAuthState(userId);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
      return NextResponse.json({ authUrl });
    }

    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 401 });
    }

    if (action === 'create-event') {
      const created = await callGoogleCalendarApi(
        calendar.accessToken,
        `/calendars/${calendar.calendarId}/events`,
        'POST',
        {
          summary: data.title,
          description: data.description,
          start: { dateTime: data.start, timeZone: calendar.timezone },
          end: { dateTime: data.end, timeZone: calendar.timezone },
          location: data.location,
          attendees: data.attendees?.map((email: string) => ({ email })),
          reminders: [{ method: 'email', minutes: 60 }, { method: 'popup', minutes: 15 }]
        }
      );
      return NextResponse.json({ success: true, eventId: created.id, event: created });
    }

    if (action === 'update-event') {
      const updated = await callGoogleCalendarApi(
        calendar.accessToken,
        `/calendars/${calendar.calendarId}/events/${data.eventId}`,
        'PATCH',
        {
          summary: data.title,
          description: data.description,
          start: data.start ? { dateTime: data.start, timeZone: calendar.timezone } : undefined,
          end: data.end ? { dateTime: data.end, timeZone: calendar.timezone } : undefined,
          location: data.location
        }
      );
      return NextResponse.json({ success: true, event: updated });
    }

    if (action === 'delete-event') {
      await callGoogleCalendarApi(
        calendar.accessToken,
        `/calendars/${calendar.calendarId}/events/${data.eventId}`,
        'DELETE'
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'quick-add') {
      const created = await callGoogleCalendarApi(
        calendar.accessToken,
        `/calendars/${calendar.calendarId}/events/quickAdd`,
        'POST',
        { text: data.text }
      );
      return NextResponse.json({ success: true, eventId: created.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
