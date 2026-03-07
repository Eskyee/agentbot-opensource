import { NextRequest, NextResponse } from 'next/server';

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

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
    const body = await request.json();
    const entry = body.entry?.[0];
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
