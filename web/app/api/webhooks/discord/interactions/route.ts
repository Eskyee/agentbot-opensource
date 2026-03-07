import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

function verifyDiscordSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  if (!DISCORD_PUBLIC_KEY) return true;

  const message = timestamp + body;
  const expectedSignature = crypto
    .createHmac('sha256', DISCORD_PUBLIC_KEY)
    .update(message)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature-ed25519');
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
