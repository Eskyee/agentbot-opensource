import { NextRequest, NextResponse } from 'next/server';

const TICKET_TOKEN_ADDRESS = '0x4ed4e862860bed51a9570b96d89af5e1b0efefed'; // USDC on Base
const TICKET_PRICE_ETH = '10000000'; // 0.01 USDC (small fee)

interface Guest {
  id: string;
  name: string;
  email?: string;
  wallet?: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'cancelled';
  tier: 'vip' | 'guestlist' | 'general' | 'press';
  timestamp: number;
  checkedInAt?: number;
}

const events = new Map<string, {
  id: string;
  name: string;
  date: string;
  venue: string;
  capacity: number;
  guestlist: Guest[];
  tiers: { name: string; price: string; count: number }[];
}>();

async function verifyPayment(wallet: string, amount: string): Promise<boolean> {
  try {
    const response = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: TICKET_TOKEN_ADDRESS,
          data: '0x70a08231000000000000000000000000' + wallet.replace('0x', '')
        }, 'latest'],
        id: 1
      })
    });
    const result = await response.json();
    const balance = BigInt(result.result || '0x0');
    return balance >= BigInt(amount);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (eventId) {
    const event = events.get(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(event);
  }

  return NextResponse.json({
    events: Array.from(events.values())
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, eventId, ...data } = body;

    if (action === 'create-event') {
      const id = 'evt_' + Math.random().toString(36).substr(2, 9);
      const event = {
        id,
        name: data.name,
        date: data.date,
        venue: data.venue,
        capacity: data.capacity || 200,
        guestlist: [],
        tiers: data.tiers || [
          { name: 'general', price: '0', count: 150 },
          { name: 'guestlist', price: '0', count: 50 }
        ]
      };
      events.set(id, event);
      return NextResponse.json({ success: true, event });
    }

    if (action === 'rsvp') {
      const event = events.get(eventId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      if (event.guestlist.length >= event.capacity) {
        return NextResponse.json({ error: 'Event full' }, { status: 400 });
      }

      const guest: Guest = {
        id: 'g_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        wallet: data.wallet,
        status: 'pending',
        tier: data.tier || 'general',
        timestamp: Date.now()
      };

      event.guestlist.push(guest);
      return NextResponse.json({ success: true, guest });
    }

    if (action === 'check-in') {
      const event = events.get(eventId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const guest = event.guestlist.find(g => g.id === data.guestId || g.wallet === data.wallet);
      if (!guest) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
      }

      if (guest.status === 'checked-in') {
        return NextResponse.json({ error: 'Already checked in', guest }, { status: 400 });
      }

      guest.status = 'checked-in';
      guest.checkedInAt = Date.now();

      return NextResponse.json({ success: true, guest });
    }

    if (action === 'buy-ticket') {
      const event = events.get(eventId);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      const tier = event.tiers.find(t => t.name === data.tier);
      if (!tier) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }

      const paid = await verifyPayment(data.wallet, tier.price);
      if (!paid && tier.price !== '0') {
        return NextResponse.json({ error: 'Insufficient payment' }, { status: 400 });
      }

      const guest: Guest = {
        id: 'g_' + Math.random().toString(36).substr(2, 9),
        name: data.name,
        email: data.email,
        wallet: data.wallet,
        status: 'confirmed',
        tier: data.tier,
        timestamp: Date.now()
      };

      event.guestlist.push(guest);
      return NextResponse.json({ success: true, guest });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Guestlist error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
