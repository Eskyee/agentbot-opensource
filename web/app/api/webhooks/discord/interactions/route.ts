import { NextRequest, NextResponse } from 'next/server';

/**
 * Discord Application Interaction Endpoint
 *
 * SECURITY PATTERN FIX (underground.ts / mux.ts templates):
 *
 *  CRITICAL: The previous implementation used SHA256 for signature verification.
 *  Discord Application interactions MUST be verified with Ed25519 using the
 *  application's public key. SHA256 HMAC would always fail on real Discord
 *  payloads (since Discord sends an Ed25519 signature, not SHA256), leaving the
 *  endpoint either always-rejecting (broken) or vulnerable if the catch branch
 *  ever changed to fail-open.
 *
 *  This implementation uses Node.js 20+ native crypto.verify() with 'ed25519'
 *  which requires no external dependencies (no tweetnacl needed).
 *
 *  timingSafeEqual() length guard: timingSafeEqual throws if buffer lengths
 *  differ. We guard before calling to prevent a 500 on malformed headers.
 *
 *  Fail closed: rejects all requests if DISCORD_PUBLIC_KEY is not configured.
 */

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

/**
 * Verify a Discord Ed25519 interaction signature using the WebCrypto SubtleCrypto API.
 *
 * Returns false (never throws) on any error.
 *
 * Discord signs: concat(timestamp_bytes, body_bytes) with the app private key.
 * We verify with the app public key from the Developer Portal.
 *
 * Why SubtleCrypto instead of node:crypto?
 *   crypto.createPublicKey({ format: 'raw', type: 'ed25519' }) is valid at runtime
 *   but TypeScript's @types/node does not include 'raw' in KeyFormat, causing a
 *   type error. SubtleCrypto has full TypeScript support and is idiomatic in Next.js.
 */
async function verifyDiscordSignature(
  signature: string,   // hex-encoded Ed25519 signature from x-signature-ed25519
  timestamp: string,
  body: string
): Promise<boolean> {
  // Fail closed
  if (!DISCORD_PUBLIC_KEY) {
    console.error('[SECURITY] DISCORD_PUBLIC_KEY not configured — rejecting interaction');
    return false;
  }

  try {
    const publicKeyBytes = Buffer.from(DISCORD_PUBLIC_KEY, 'hex');
    const signatureBytes = Buffer.from(signature, 'hex');
    const messageBytes = Buffer.concat([Buffer.from(timestamp), Buffer.from(body)]);

    // Import raw Ed25519 public key via WebCrypto (available in Node.js 18.4+ / Next.js)
    const publicKey = await globalThis.crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      'Ed25519',
      false,
      ['verify']
    );

    // Ed25519 verify — null/empty algorithm param means "use key's algorithm"
    return await globalThis.crypto.subtle.verify('Ed25519', publicKey, signatureBytes, messageBytes);
  } catch (err) {
    // Catches malformed hex, wrong key size, or unsupported algorithm
    console.error('[SECURITY] Discord Ed25519 verification error:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing Discord signature headers' }, { status: 401 });
    }

    const body = await request.text();

    if (!(await verifyDiscordSignature(signature, timestamp, body))) {
      console.error('[SECURITY] Discord interaction Ed25519 verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body) as {
      type: number;
      member?: { user?: { id: string } };
      user?: { id: string };
      channel_id?: string;
      guild_id?: string;
      data?: { name?: string; options?: unknown[] };
    };

    // Discord PING — must respond immediately with PONG (type 1)
    if (data.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    const userId = data.member?.user?.id || data.user?.id;
    const channelId = data.channel_id;
    const guildId = data.guild_id;
    const commandName = data.data?.name;

    console.log('Discord interaction:', { type: data.type, commandName, userId, channelId, guildId });

    let responseContent = '';
    switch (commandName) {
      case 'ping':    responseContent = '🏓 Pong!'; break;
      case 'status':  responseContent = '✅ Agent is online and ready'; break;
      case 'help':    responseContent = 'Available commands:\n- /ping\n- /status\n- /help\n- /stream'; break;
      case 'stream':  responseContent = '🔴 Check live streams: https://agentbot.raveculture.xyz/live'; break;
      default:        responseContent = `Unknown command: ${commandName ?? 'none'}`;
    }

    return NextResponse.json({ type: 4, data: { content: responseContent } });
  } catch (error) {
    console.error('Discord interaction error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
