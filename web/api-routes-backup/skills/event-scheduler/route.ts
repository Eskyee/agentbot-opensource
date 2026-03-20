export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

interface ScheduledEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  timezone: string;
  channels: string[];
  message?: string;
  recurring?: string;
}

const scheduledEvents = new Map<string, ScheduledEvent>();

const mockEvents: ScheduledEvent[] = [
  { id: 's1', title: 'Weekly Newsletter', date: '2026-03-20', time: '18:00', timezone: 'UTC', channels: ['email', 'telegram'], recurring: 'weekly' },
  { id: 's2', title: 'New Release Drop', date: '2026-04-01', time: '12:00', timezone: 'UTC', channels: ['telegram', 'discord', 'twitter'] },
  { id: 's3', title: 'Base FM Show', date: '2026-03-22', time: '22:00', timezone: 'UTC', channels: ['base-fm'], recurring: 'weekly' },
];

const VALID_CHANNELS = ['telegram', 'discord', 'whatsapp', 'email', 'twitter', 'base-fm'];
const VALID_RECURRING = ['daily', 'weekly', 'monthly', null];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const VALID_ACTIONS = ['list', 'schedule', 'cancel', 'upcoming'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'list') {
      return NextResponse.json({ success: true, events: mockEvents });
    }

    if (action === 'schedule') {
      if (!data.title || !data.date || !data.time) {
        return NextResponse.json({ error: 'title, date, time required' }, { status: 400 });
      }

      const channels = Array.isArray(data.channels) 
        ? data.channels.filter((c: string) => VALID_CHANNELS.includes(c)).slice(0, 5)
        : ['telegram'];

      const recurring = VALID_RECURRING.includes(data.recurring) ? data.recurring : null;

      const id = 'sch_' + Math.random().toString(36).substr(2, 9);
      const event: ScheduledEvent = {
        id,
        title: data.title.slice(0, 100),
        date: data.date.slice(0, 10),
        time: data.time.slice(0, 5),
        timezone: data.timezone || 'UTC',
        channels,
        message: data.message?.slice(0, 500),
        recurring
      };

      scheduledEvents.set(id, event);

      return NextResponse.json({
        success: true,
        event: {
          id: event.id,
          title: event.title,
          scheduled: `${event.date} ${event.time} ${event.timezone}`,
          channels: event.channels.join(', '),
          recurring: event.recurring || 'one-time'
        }
      });
    }

    if (action === 'cancel') {
      if (!data.eventId) {
        return NextResponse.json({ error: 'eventId required' }, { status: 400 });
      }

      const event = scheduledEvents.get(data.eventId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      scheduledEvents.delete(data.eventId);
      return NextResponse.json({ success: true, message: 'Event cancelled' });
    }

    if (action === 'upcoming') {
      const now = new Date();
      const upcoming = [...mockEvents, ...Array.from(scheduledEvents.values())]
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10);

      return NextResponse.json({ success: true, events: upcoming });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Event Scheduler error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'event-scheduler',
    name: 'Event Scheduler',
    description: 'Schedule events across Telegram, Discord, WhatsApp, Email',
    security: { inputValidation: true, demoMode: true },
    actions: {
      list: 'List scheduled events',
      schedule: 'Schedule new event',
      cancel: 'Cancel scheduled event',
      upcoming: 'Get upcoming events'
    },
    channels: VALID_CHANNELS
  });
}
