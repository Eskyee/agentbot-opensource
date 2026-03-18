import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

function verifyDiscordSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Fail closed - deny if public key not configured
  if (!DISCORD_PUBLIC_KEY) {
    console.error('Discord webhook: DISCORD_PUBLIC_KEY not configured');
    return false;
  }

  const message = timestamp + body;
  
  try {
    // Discord sends signature as hex string prefixed with sha256=
    const expectedSignature = crypto
      .createHash('sha256')
      .update(message)
      .digest('hex');
    
    // Timing-safe comparison
    const sig = signature.replace(/^sha256=/, '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(sig)
    );
  } catch (err) {
    console.error('Discord signature verification error:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature-ed25519') || request.headers.get('x-signature-sha256');
    const timestamp = request.headers.get('x-signature-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const body = await request.text();

    if (!verifyDiscordSignature(signature, timestamp, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    if (data.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    const userId = data.member?.user?.id || data.user?.id;
    const channelId = data.channel_id;
    const guildId = data.guild_id;
    const commandName = data.data?.name;
    const commandOptions = data.data?.options || [];

    console.log('Discord interaction:', {
      type: data.type,
      commandName,
      userId,
      channelId,
      guildId
    });

    let responseContent = '';

    if (commandName === 'ping') {
      responseContent = '🏓 Pong!';
    } else if (commandName === 'status') {
      responseContent = '✅ Agent is online and ready';
    } else if (commandName === 'help') {
      responseContent = 'Available commands:\n- /ping\n- /status\n- /help\n- /stream';
    } else if (commandName === 'stream') {
      responseContent = '🔴 Check live streams: https://agentbot.raveculture.xyz/live';
    }

    return NextResponse.json({
      type: 4,
      data: {
        content: responseContent
      }
    });
  } catch (error) {
    console.error('Discord interaction error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
