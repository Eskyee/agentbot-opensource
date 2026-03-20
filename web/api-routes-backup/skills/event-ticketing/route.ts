export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

const VALID_TIERS = ['general', 'vip', 'early-bird', 'student'];
const VALID_STATUS = ['pending', 'confirmed', 'cancelled', 'refunded'];

interface Ticket {
  id: string;
  eventId: string;
  purchaserEmail: string;
  tier: string;
  status: string;
  price: number;
  purchasedAt: number;
}

const tickets = new Map<string, Ticket>();

const mockEvents = [
  { id: 'e1', name: 'Basement Sessions Vol. 3', date: '2026-04-12', venue: 'The Basement', price: 15 },
  { id: 'e2', name: 'Rave Culture NYE', date: '2026-12-31', venue: 'Warehouse 42', price: 35 },
  { id: 'e3', name: 'Techno Sunrise', date: '2026-05-20', venue: 'Rooftop花园', price: 20 },
];

function sanitizeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const VALID_ACTIONS = ['list', 'create', 'purchase', 'check', 'refund'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'list') {
      return NextResponse.json({ success: true, events: mockEvents });
    }

    if (action === 'create') {
      if (!data.name || !data.date || !data.venue) {
        return NextResponse.json({ error: 'Name, date, venue required' }, { status: 400 });
      }
      const id = 'evt_' + Math.random().toString(36).substr(2, 9);
      const event = {
        id,
        name: data.name.slice(0, 100),
        date: data.date.slice(0, 10),
        venue: data.venue.slice(0, 100),
        price: Math.max(0, Math.min(1000, Number(data.price) || 15)),
        tiers: data.tiers || ['general', 'vip']
      };
      return NextResponse.json({ success: true, event });
    }

    if (action === 'purchase') {
      if (!data.eventId || !data.email) {
        return NextResponse.json({ error: 'eventId and email required' }, { status: 400 });
      }
      if (!sanitizeEmail(data.email)) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
      }
      
      const event = mockEvents.find(e => e.id === data.eventId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const tier = VALID_TIERS.includes(data.tier) ? data.tier : 'general';
      const id = 'tkt_' + Math.random().toString(36).substr(2, 9);
      const ticket: Ticket = {
        id,
        eventId: data.eventId,
        purchaserEmail: data.email,
        tier,
        status: 'pending',
        price: event.price,
        purchasedAt: Date.now()
      };
      tickets.set(id, ticket);

      // x402 USDC payment on Base
      const paymentAddress = '0xd8fd0e1dce89beaab924ac68098ddb17613db56f';
      
      return NextResponse.json({
        success: true,
        pending: true,
        ticket: {
          id: ticket.id,
          event: event.name,
          tier: ticket.tier,
          price: ticket.price,
          currency: 'USDC',
          network: 'base'
        },
        payment: {
          protocol: 'x402',
          payTo: paymentAddress,
          amount: ticket.price.toString(),
          token: 'USDC',
          chain: 'eip155:8453',
          instructions: `Send ${ticket.price} USDC to ${paymentAddress} on Base mainnet`
        }
      });
    }

    if (action === 'check') {
      if (!data.ticketId) {
        return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
      }
      const ticket = tickets.get(data.ticketId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, ticket });
    }

    if (action === 'refund') {
      if (!data.ticketId) {
        return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
      }
      const ticket = tickets.get(data.ticketId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      ticket.status = 'refunded';
      return NextResponse.json({ success: true, message: 'Refund processed in USDC' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Event Ticketing error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'event-ticketing',
    name: 'Event Ticketing',
    description: 'Sell tickets for events with USDC payments on Base',
    security: { inputValidation: true, emailValidation: true, demoMode: true },
    actions: {
      list: 'List available events',
      create: 'Create new event',
      purchase: 'Purchase ticket with USDC',
      check: 'Verify ticket',
      refund: 'Process refund'
    }
  });
}
