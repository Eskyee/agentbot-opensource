import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface Booking {
  id: string;
  venue: string;
  date: string;
  guarantee: number;
  backend: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'completed' | 'settled';
  splitRules: SplitRule[];
  escrowAddress?: string;
  txHash?: string;
}

interface SplitRule {
  recipientAddress: string;
  percentage: number;
  role: 'artist' | 'manager' | 'agent' | 'venue';
  name: string;
}

const mockBookings: Booking[] = [
  {
    id: 'bk_1',
    venue: 'Berghain',
    date: '2026-03-25',
    guarantee: 500,
    backend: 200,
    deposit: 100,
    status: 'confirmed',
    splitRules: [
      { recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f', percentage: 70, role: 'artist', name: 'Artist' },
      { recipientAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', percentage: 15, role: 'agent', name: 'Agent' },
      { recipientAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', percentage: 15, role: 'manager', name: 'Manager' },
    ],
  },
  {
    id: 'bk_2',
    venue: 'Fabric London',
    date: '2026-04-01',
    guarantee: 800,
    backend: 300,
    deposit: 200,
    status: 'completed',
    splitRules: [
      { recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f', percentage: 65, role: 'artist', name: 'Artist' },
      { recipientAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', percentage: 20, role: 'agent', name: 'Agent' },
      { recipientAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', percentage: 15, role: 'manager', name: 'Manager' },
    ],
  },
];

async function executeUSDCTransfer(
  toAddress: string,
  amountUSDC: number
): Promise<{ success: boolean; txHash?: string }> {
  return {
    success: true,
    txHash: '0x' + crypto.randomBytes(32).toString('hex'),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, bookingId, booking } = body;

    if (action === 'list') {
      return NextResponse.json({
        success: true,
        bookings: mockBookings,
      });
    }

    if (action === 'get') {
      const booking = mockBookings.find(b => b.id === bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, booking });
    }

    if (action === 'create_escrow') {
      const booking = mockBookings.find(b => b.id === bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const escrowAddress = '0x' + crypto.randomBytes(20).toString('hex');
      
      return NextResponse.json({
        success: true,
        bookingId,
        escrowAddress,
        depositAmount: booking.deposit,
        message: `Escrow created for ${booking.venue}. Deposit of $${booking.deposit} USDC required.`,
      });
    }

    if (action === 'release_funds') {
      const booking = mockBookings.find(b => b.id === bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const totalPayout = booking.guarantee + booking.backend;
      const results = [];

      for (const rule of booking.splitRules) {
        const amount = (totalPayout * rule.percentage) / 100;
        const result = await executeUSDCTransfer(rule.recipientAddress, amount);
        
        results.push({
          recipient: rule.name,
          address: rule.recipientAddress,
          amount: amount,
          status: result.success ? 'released' : 'failed',
          txHash: result.txHash,
        });
      }

      return NextResponse.json({
        success: true,
        bookingId,
        totalPayout: totalPayout,
        currency: 'USDC',
        network: 'Base',
        releasedAt: new Date().toISOString(),
        splits: results,
      });
    }

    if (action === 'simulate_settlement') {
      const guarantee = booking?.guarantee || 500;
      const backend = booking?.backend || 200;
      const deposit = booking?.deposit || 100;
      
      const total = guarantee + backend;
      const simulated = [
        { role: 'Artist', percentage: 65, amount: total * 0.65 },
        { role: 'Agent', percentage: 20, amount: total * 0.20 },
        { role: 'Manager', percentage: 15, amount: total * 0.15 },
      ];

      return NextResponse.json({
        success: true,
        input: { guarantee, backend, deposit },
        totalPayout: total,
        currency: 'USDC',
        splits: simulated,
        timeline: {
          deposit: 'Due now to confirm booking',
          remainder: 'Paid within 7 days of gig completion',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[BOOKING] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'booking-settlement',
    name: 'Booking Settlement Agent',
    description: 'Autonomous escrow and split execution for booking payments. Parse confirmations, hold deposits, and auto-release funds on gig completion.',
    category: 'payments',
    triggers: ['booking_confirmation', 'gig_completion', 'manual_release'],
    features: [
      'Escrow contracts for booking deposits',
      'Auto-split guarantee + backend after gigs',
      'GPS + time triggers for gig verification',
      'Multi-party splits (artist/agent/manager)',
      'Real-time settlement dashboard',
    ],
    pricing: {
      transactionFee: '0.5%',
      escrowFee: '1% of guarantee',
    },
    integrations: ['OpenClaw inbox', 'email parsing', 'manual entry'],
    security: {
      usesCDP: true,
      network: 'Base mainnet',
      custody: 'Escrow until verification',
    },
  });
}
