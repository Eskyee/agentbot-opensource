import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const MUX_SIGNING_SECRET = process.env.MUX_SIGNING_SECRET;

function verifyMuxSignature(request: NextRequest): boolean {
  if (!MUX_SIGNING_SECRET) {
    console.warn('MUX_SIGNING_SECRET not configured - skipping verification');
    return true;
  }

  const signature = request.headers.get('mux-signature');
  const timestamp = request.headers.get('mux-timestamp');

  if (!signature || !timestamp) {
    return false;
  }

  const body = JSON.stringify(request.body);
  const payload = timestamp + '.' + body;
  const expectedSignature = crypto
    .createHmac('sha256', MUX_SIGNING_SECRET)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyMuxSignature(request)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = await request.json();
    console.log('Mux webhook received:', event.type, event.data?.id);

    switch (event.type) {
      case 'video.live_stream.active':
        console.log('Live stream is now active:', event.data.id);
        break;
      
      case 'video.live_stream.idle':
        console.log('Live stream is now idle:', event.data.id);
        break;
      
      case 'video.live_stream.disabled':
        console.log('Live stream disabled:', event.data.id);
        break;
      
      case 'video.asset.ready':
        console.log('Asset ready:', event.data.id, 'Playback ID:', event.data.playback_ids?.[0]?.id);
        break;
      
      case 'video.asset.errored':
        console.log('Asset error:', event.data.id);
        break;
      
      default:
        console.log('Unhandled Mux event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mux webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
