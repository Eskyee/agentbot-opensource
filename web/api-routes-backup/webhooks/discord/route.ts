export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY;

function verifyApiKey(request: NextRequest): boolean {
  const providedKey = request.headers.get('x-api-key');
  
  // Fail closed if API key not configured
  if (!WEBHOOK_API_KEY) {
    console.error('[SECURITY] WEBHOOK_API_KEY not configured - rejecting request');
    return false;
  }
  
  return providedKey === WEBHOOK_API_KEY;
}

export async function POST(request: NextRequest) {
  // Verify API key
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { guildId, channelId, message, embed } = body;

    if (!channelId || !message) {
      return NextResponse.json(
        { error: 'channelId and message required' },
        { status: 400 }
      );
    }

    const discordPayload: any = {
      content: message
    };

    if (embed) {
      discordPayload.embeds = [embed];
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(discordPayload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Discord API error:', error);
      return NextResponse.json(
        { error: 'Failed to send Discord message' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');

  if (!guildId || !DISCORD_BOT_TOKEN) {
    return NextResponse.json({ error: 'guildId required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: response.status }
      );
    }

    const channels = await response.json();
    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Discord error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
