import { NextRequest, NextResponse } from 'next/server';

const mockRoyalties = [
  { id: 'r1', track: 'Midnight Systems', stream: 15420, rate: 0.003, platform: 'Spotify', date: '2026-02' },
  { id: 'r2', track: 'Neural Pathways', stream: 8930, rate: 0.003, platform: 'Spotify', date: '2026-02' },
  { id: 'r3', track: 'Crypto Hearts', stream: 2340, rate: 0.004, platform: 'Apple Music', date: '2026-02' },
  { id: 'r4', track: 'Base FM Broadcast', stream: 45000, rate: 0.001, platform: 'Base FM', date: '2026-02' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'list') {
      return NextResponse.json({ success: true, royalties: mockRoyalties });
    }

    if (action === 'total') {
      const total = mockRoyalties.reduce((sum, r) => sum + (r.stream * r.rate), 0);
      return NextResponse.json({ success: true, total: total.toFixed(2), currency: 'USDC' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'royalty-tracker',
    name: 'Royalty Tracker',
    description: 'Track streaming royalties across platforms',
    security: { readOnly: true, mockData: true }
  });
}
