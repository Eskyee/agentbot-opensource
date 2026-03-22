import { NextRequest, NextResponse } from 'next/server';
import crypto, { timingSafeEqual } from 'crypto';

/**
 * WhatsApp Cloud API Webhook Handler
 *
 * SECURITY PATTERNS APPLIED (underground.ts / mux.ts templates):
 *
 *  1. Fail closed: if WHATSAPP_WEBHOOK_SECRET is not configured ALL POST requests
 *     are rejected — the previous code allowed unauthenticated processing when the
 *     secret was absent.
 *
 *  2. timingSafeEqual() length guard: crypto.timingSafeEqual() throws a TypeError
 *     if its two arguments have different byte-lengths. An attacker sending a
 *     truncated or padded signature header could trigger a 500 instead of a 401,
 *     revealing information about the server state. We now compare lengths first
 *     and return false (never throw) on a mismatch.
 *
 *  3. Timing-safe challenge token: the GET hub.verify_token comparison is now also
 *     timing-safe so the challenge endpoint cannot be used to enumerate the token.
 */

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';

/**
 * Timing-safe HMAC-SHA256 signature verification.
 * Returns false (never throws) on any error, including length mismatch.
 */
function verifyWhatsAppSignature(body: string, signature: string): boolean {
  // Fail closed: reject if signing secret not configured
  if (!WHATSAPP_WEBHOOK_SECRET) {
    console.error('[SECURITY] WHATSAPP_WEBHOOK_SECRET not configured — rejecting request');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WHATSAPP_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  // timingSafeEqual() throws if lengths differ — guard before calling
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * GET /api/webhooks/whatsapp
 * WhatsApp challenge verification (webhook registration).
 * hub.verify_token is compared with timingSafeEqual to prevent enumeration.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token') || '';
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }

  // Timing-safe comparison for the challenge token
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(WHATSAPP_VERIFY_TOKEN);
  const tokenMatch =
    tokenBuf.length === expectedBuf.length && timingSafeEqual(tokenBuf, expectedBuf);

  if (!tokenMatch) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

/**
 * POST /api/webhooks/whatsapp
 * Receives incoming WhatsApp messages.
 * Always fails closed — rejects if WHATSAPP_WEBHOOK_SECRET is not configured.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256') || '';
    const body = await request.text();

    // Fail closed: require secret to be configured in ALL environments
    if (!WHATSAPP_WEBHOOK_SECRET) {
      console.error('[SECURITY] WHATSAPP_WEBHOOK_SECRET not configured — rejecting webhook');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    if (!signature) {
      console.error('[SECURITY] WhatsApp webhook missing x-hub-signature-256 header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Strip the "sha256=" prefix Meta prepends
    const rawSig = signature.replace(/^sha256=/, '');
    if (!verifyWhatsAppSignature(body, rawSig)) {
      console.error('[SECURITY] WhatsApp webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const entry = data.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ received: true });
    }

    const from = message.from as string;
    const messageType = message.type as string;
    const text = message.text?.body as string | undefined;

    console.log('WhatsApp message received:', {
      from,
      type: messageType,
      timestamp: message.timestamp,
    });

    const content = text || `[${messageType} message]`;

    const agentResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.raveculture.xyz'}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          platform: 'whatsapp',
          userId: from,
          sessionId: `whatsapp_${from}`,
        }),
      }
    );

    const responseData = await agentResponse.json() as { reply?: string };

    if (responseData.reply) {
      const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (whatsappToken && phoneNumberId) {
        await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: from,
              text: { body: responseData.reply },
            }),
          }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
