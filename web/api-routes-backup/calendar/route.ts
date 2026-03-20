export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://agentbot.raveculture.xyz/api/calendar/callback';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  reminders?: { method: string; minutes: number }[];
  recurring?: string;
  colorId?: string;
}

interface UserCalendar {
  userId: string;
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  timezone: string;
}

const userCalendars = new Map<string, UserCalendar>();

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const code = searchParams.get('code');

  if (action === 'auth') {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}&access_type=offline&prompt=consent`;
    return NextResponse.redirect(authUrl);
  }

  if (action === 'callback' && code && userId) {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || '',
          client_secret: GOOGLE_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_REDIRECT_URI
        })
      });

      const tokens = await tokenResponse.json();

      const calendarData = await callGoogleCalendarApi(tokens.access_token, '/users/me/calendarList/primary');
      const settings = await callGoogleCalendarApi(tokens.access_token, '/users/me/settings/timezone');

      userCalendars.set(userId, {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        calendarId: calendarData.id || 'primary',
        timezone: settings.value || 'UTC'
      });

      return NextResponse.redirect(`/dashboard/calendar?connected=true`);
    } catch (error) {
      console.error('Calendar auth error:', error);
      return NextResponse.redirect('/dashboard/calendar?error=auth_failed');
    }
  }

  if (action === 'list' && userId) {
    const calendar = userCalendars.get(userId);
    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 401 });
    }

    const start = searchParams.get('start') || new Date().toISOString();
    const end = searchParams.get('end') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const events = await callGoogleCalendarApi(
      calendar.accessToken,
      `/calendars/${calendar.calendarId}/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`
    );

    return NextResponse.json({
      events: events.items || [],
      timezone: calendar.timezone
    });
  }

  if (action === 'availability' && userId) {
    const calendar = userCalendars.get(userId);
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
    actions: ['auth', 'callback', 'list', 'availability']
  });
}

function generateAvailableSlots(date: string, busySlots: { start: string; end: string }[]) {
  const slots = [];
  const startHour = 9;
  const endHour = 23;
  const slotDuration = 60;

  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = `${date}T${hour.toString().padStart(2, '0')}:00:00`;
    const slotEnd = `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`;

    const isBusy = busySlots.some(busy => {
      return slotStart < busy.end && slotEnd > busy.start;
    });

    if (!isBusy) {
      slots.push({ start: slotStart, end: slotEnd });
    }
  }

  return slots;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, ...data } = body;
    const calendar = userCalendars.get(userId);

    if (action === 'connect' && !calendar) {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}&access_type=offline&prompt=consent&state=${userId}`;
      return NextResponse.json({ authUrl });
    }

    if (!calendar) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 401 });
    }

    if (action === 'create-event') {
      const event: CalendarEvent = {
        id: '',
        title: data.title,
        description: data.description,
        start: data.start,
        end: data.end,
        location: data.location,
        attendees: data.attendees,
        reminders: [{ method: 'email', minutes: 60 }, { method: 'popup', minutes: 15 }]
      };

      const created = await callGoogleCalendarApi(
        calendar.accessToken,
        `/calendars/${calendar.calendarId}/events`,
        'POST',
        {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start, timeZone: calendar.timezone },
          end: { dateTime: event.end, timeZone: calendar.timezone },
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })),
          reminders: event.reminders
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
