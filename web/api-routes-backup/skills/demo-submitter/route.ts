export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

const mockQueue = [
  { id: 'd1', title: 'Dark Matter', artist: 'Techno Tom', status: 'pending', submitted: '2026-03-10' },
  { id: 'd2', title: 'Neon Nights', artist: 'Rave Rachel', status: 'approved', submitted: '2026-03-08' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'submit') {
      const id = 'd_' + Math.random().toString(36).substr(2, 9);
      const submission = {
        id,
        title: data.title || 'Untitled',
        artist: data.artist || 'Unknown',
        status: 'pending',
        submitted: new Date().toISOString().split('T')[0]
      };
      return NextResponse.json({ success: true, submission });
    }

    if (action === 'queue') {
      return NextResponse.json({ success: true, queue: mockQueue });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    skill: 'demo-submitter',
    name: 'Demo Submitter',
    description: 'Submit demos to Base FM for airplay consideration',
    security: { demoMode: true, mockData: true }
  });
}
