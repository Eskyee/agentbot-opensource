import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Mux Webhook Handler for baseFM (Hardened)
 * Listen for stream status changes and asset readiness.
 * Includes Signature Verification to prevent external agent probing.
 */

const MUX_SIGNING_SECRET = process.env.MUX_SIGNING_SECRET || process.env.MUX_WEBHOOK_SECRET;

function verifyMuxSignature(body: string, signature: string): boolean {
  // Fail closed - deny if signing secret not configured
  if (!MUX_SIGNING_SECRET) {
    console.error('[SECURITY] MUX_SIGNING_SECRET not configured - rejecting request');
    return false;
  }

  // Mux sends signature in format: t=timestamp,v1=signature
  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const sig = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !sig) return false;

  // Verify timestamp is within 5 minutes to prevent replay attacks
  const webhookAge = Date.now() - parseInt(timestamp) * 1000;
  if (webhookAge > 5 * 60 * 1000) {
    console.error('[SECURITY] Mux webhook timestamp too old, possible replay attack');
    return false;
  }

  const payload = timestamp + '.' + body;
  const expectedSignature = crypto
    .createHmac('sha256', MUX_SIGNING_SECRET)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('mux-signature');
    const body = await request.text();

    if (!signature) {
      console.error('[SECURITY] Webhook received without Mux Signature. Dropping.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!verifyMuxSignature(body, signature)) {
      console.error('[SECURITY] Signature verification failed. Probing attempt suspected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    console.log(`[MUX WEBHOOK] Received verified event: ${type}`);

    switch (type) {
      case 'video.asset.ready':
        // Elite Archive Logic: Only store 1080p+ and 15min+ sets
        const isHighRes = data.max_stored_resolution === 'HD' || data.resolution_tier === '1080p';
        const isLongEnough = data.duration > 900; // 15 minutes

        if (isHighRes && isLongEnough) {
          console.log(`[ARCHIVE] Saving Elite Set: ${data.id} (${data.resolution_tier})`);
          // TRIGGER: Social Archive Post
        } else {
          console.log(`[PRUNE] Low res or short set detected (${data.id}). Queued for deletion.`);
        }
        break;

      case 'video.live_stream.active':
        console.log(`[LIVE] Verified Stream is active: ${data.id}`);
        // TRIGGER: Social Amplification
        break;

      case 'video.live_stream.idle':
        console.log(`[IDLE] Verified Stream stopped: ${data.id}`);
        // TRIGGER: AI Set Summary via DeepSeek/Llama
        break;

      default:
        console.log(`Unhandled Mux event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[MUX WEBHOOK ERROR]:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
