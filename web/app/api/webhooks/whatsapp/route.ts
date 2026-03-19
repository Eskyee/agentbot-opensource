import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;

function verifyWhatsAppSignature(body: string, signature: string): boolean {
  // Fail closed if no secret configured
  if (!WHATSAPP_WEBHOOK_SECRET) {
    console.error('[SECURITY] WHATSAPP_WEBHOOK_SECRET not configured');
    return false;
  }

  // WhatsApp signs with HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', WHATSAPP_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();

    if (WHATSAPP_WEBHOOK_SECRET && signature) {
      const isValid = verifyWhatsAppSignature(body, signature.replace(/^sha256=/, ''));
      if (!isValid) {
        console.error('[SECURITY] WhatsApp webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (WHATSAPP_WEBHOOK_SECRET && !signature) {
      // Secret is configured but no signature provided
      console.error('[SECURITY] WhatsApp webhook missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const entry = data.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    
    if (!message) {
      return NextResponse.json({ received: true });
    }

    const from = message.from;
    const messageType = message.type;
    const text = message.text?.body;
    const image = message.image?.id;
    const audio = message.audio?.id;
    const document = message.document?.id;

    console.log('WhatsApp message received:', {
      from,
      type: messageType,
      text,
      timestamp: message.timestamp
    });

    const userId = from;
    const content = text || `[${messageType} message]`;

    const agentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot.raveculture.xyz'}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        platform: 'whatsapp',
        userId,
        sessionId: `whatsapp_${from}`
      })
    });

    const responseData = await agentResponse.json();
    
    if (responseData.reply) {
      const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (whatsappToken && phoneNumberId) {
        await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: from,
            text: { body: responseData.reply }
          })
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
