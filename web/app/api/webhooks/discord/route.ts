import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Outbound Discord message sender — accepts requests from internal services.
 *
 * SECURITY PATTERN (underground.ts template):
 *  - API key is compared with timingSafeEqual() to prevent timing-oracle attacks.
 *    A plain `===` comparison leaks information about how many characters match
 *    because JavaScript short-circuits on the first mismatch.
 *  - Buffer lengths are compared first; timingSafeEqual() throws if lengths differ,
 *    so we must guard that case explicitly and return false without leaking timing.
 *  - Fail closed: if WEBHOOK_API_KEY is not configured, all requests are rejected.
 */

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY;

/**
 * Timing-safe API key verification.
 * Returns false (never throws) if the key is missing, wrong, or wrong length.
 */
function verifyApiKey(request: NextRequest): boolean {
  const providedKey = request.headers.get('x-api-key') || '';

  // Fail closed: reject all requests if the expected key is not configured
  if (!WEBHOOK_API_KEY) {
    console.error('[SECURITY] WEBHOOK_API_KEY not configured — rejecting request');
    return false;
  }

  const providedBuf = Buffer.from(providedKey);
  const expectedBuf = Buffer.from(WEBHOOK_API_KEY);

  // timingSafeEqual() THROWS if buffers have different lengths — guard first
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  // Verify API key before processing any request body
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { channelId, message, embed } = body;

    if (!channelId || !message) {
      return NextResponse.json(
        { error: 'channelId and message required' },
        { status: 400 }
      );
    }

    const discordPayload: Record<string, unknown> = { content: message };
    if (embed) {
      discordPayload.embeds = [embed];
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordPayload),
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

    const result = await response.json() as { id: string };
    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Require the same internal key for list-channels queries
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');

  if (!guildId || !DISCORD_BOT_TOKEN) {
    return NextResponse.json({ error: 'guildId required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
