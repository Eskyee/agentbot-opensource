import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { getCommunityProgramForUser } from '@/app/lib/communityProgram';
import { prisma } from '@/app/lib/prisma';

const MAX_SESSION_SECONDS = 7200; // 2 hours

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;
const MUX_RTMP_URL = 'rtmp://global-live.mux.com:5222/app';

const RAVE_TOKEN_ADDRESS = '0xdf3c79a5759eeedb844e7481309a75037b8e86f5';
const RAVE_TOKEN_THRESHOLD = BigInt('1250000000000000000000000'); // 1,250,000 RAVE in wei

async function verifyRAVEBalance(walletAddress: string): Promise<boolean> {
  try {
    const response = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: RAVE_TOKEN_ADDRESS,
          data: '0x70a08231000000000000000000000000' + walletAddress.replace('0x', '')
        }, 'latest'],
        id: 1
      })
    });
    const result = await response.json();
    const balance = BigInt(result.result || '0x0');
    return balance >= RAVE_TOKEN_THRESHOLD;
  } catch (error) {
    console.error('Error verifying RAVE balance:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      { error: 'Mux not configured' },
      { status: 500 }
    );
  }

  try {
    const session = await getAuthSession()
    const body = await request.json();
    const { wallet, name } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const [hasRaveAccess, communityProgram] = await Promise.all([
      verifyRAVEBalance(wallet),
      session?.user?.id ? getCommunityProgramForUser(session.user.id).catch(() => null) : Promise.resolve(null),
    ])

    const hasCommunityPass = communityProgram?.perks.some(
      (perk) => perk.key === 'basefm-pass' && perk.unlocked
    ) || false

    if (!hasRaveAccess && !hasCommunityPass) {
      return NextResponse.json(
        { error: 'Insufficient RAVE tokens or community guest pass. Need 1,250,000 RAVE or a Builder/Whale Agentbot claim.' },
        { status: 403 }
      );
    }

    // Create stream via Mux API
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');
    
    const response = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
        metadata: {
          dj_wallet: wallet,
          dj_name: name || 'Anonymous DJ',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mux API error:', error);
      return NextResponse.json(
        { error: 'Failed to create stream' },
        { status: response.status }
      );
    }

    const result = await response.json();
    const stream = result.data;

    // Check for existing active session
    const existingSession = await prisma.dj_sessions.findFirst({
      where: { wallet, status: 'active' },
      orderBy: { started_at: 'desc' },
    })

    if (existingSession) {
      const elapsed = Math.floor((Date.now() - existingSession.started_at.getTime()) / 1000)
      const remaining = Math.max(0, MAX_SESSION_SECONDS - elapsed)
      
      if (remaining <= 0) {
        // Auto-end the old session
        await prisma.dj_sessions.update({
          where: { id: existingSession.id },
          data: { status: 'auto-ended', ended_at: new Date() },
        })
      } else {
        return NextResponse.json(
          {
            error: 'active_session_exists',
            message: `You already have an active stream. ${Math.floor(remaining / 60)} minutes remaining.`,
            remaining,
            sessionId: existingSession.id,
          },
          { status: 409 }
        )
      }
    }

    // Create session record
    const sessionRecord = await prisma.dj_sessions.create({
      data: {
        user_id: session?.user?.id || 'anonymous',
        wallet,
        dj_name: name || 'Anonymous DJ',
        mux_stream_id: stream.id,
        playback_id: stream.playback_ids?.[0]?.id || null,
        max_duration: MAX_SESSION_SECONDS,
      },
    })

    return NextResponse.json({
      success: true,
      stream: {
        id: stream.id,
        name: stream.metadata?.dj_name || name || 'Anonymous DJ',
        wallet: wallet,
        streamKey: stream.stream_key,
        rtmpUrl: MUX_RTMP_URL,
        fullRtmpUrl: `${MUX_RTMP_URL}/${stream.stream_key}`,
        playbackId: stream.playback_ids?.[0]?.id || null,
        status: stream.status,
        accessGrantedBy: hasRaveAccess ? 'rave' : 'community-pass',
      },
      session: {
        id: sessionRecord.id,
        maxDuration: MAX_SESSION_SECONDS,
        remaining: MAX_SESSION_SECONDS,
        expiresAt: new Date(Date.now() + MAX_SESSION_SECONDS * 1000).toISOString(),
      },
      obsSettings: {
        server: MUX_RTMP_URL,
        streamKey: stream.stream_key,
        recommended: {
          video: {
            resolution: '1280x720 (720p) or 1920x1080 (1080p)',
            bitrate: '2500-4500 kbps',
            framerate: '30 fps',
            encoder: 'H.264',
            keyframeInterval: '2 seconds',
          },
          audio: {
            bitrate: '256-320 kbps',
            encoder: 'AAC',
            sampleRate: '44.1 kHz',
            channels: 'Stereo',
          },
        },
      },
      streamType: 'video+audio',
      playback: {
        hls: stream.playback_ids?.[0]?.id ? `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8` : null,
        web: stream.playback_ids?.[0]?.id ? `https://stream.mux.com/${stream.playback_ids[0].id}.html` : null,
      },
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/basefm/streams?wallet=WALLET
 * Check active session status and remaining time
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet required' }, { status: 400 })
  }

  const activeSession = await prisma.dj_sessions.findFirst({
    where: { wallet, status: 'active' },
    orderBy: { started_at: 'desc' },
  })

  if (!activeSession) {
    return NextResponse.json({
      active: false,
      message: 'No active session. Start a new stream!',
    })
  }

  const elapsed = Math.floor((Date.now() - activeSession.started_at.getTime()) / 1000)
  const remaining = Math.max(0, MAX_SESSION_SECONDS - elapsed)

  if (remaining <= 0) {
    await prisma.dj_sessions.update({
      where: { id: activeSession.id },
      data: { status: 'auto-ended', ended_at: new Date() },
    })
    return NextResponse.json({
      active: false,
      message: 'Session expired (2h max). Start a new stream!',
    })
  }

  return NextResponse.json({
    active: true,
    session: {
      id: activeSession.id,
      djName: activeSession.dj_name,
      playbackId: activeSession.playback_id,
      startedAt: activeSession.started_at,
      elapsed,
      remaining,
      remainingMinutes: Math.floor(remaining / 60),
      expiresAt: new Date(activeSession.started_at.getTime() + MAX_SESSION_SECONDS * 1000).toISOString(),
    },
  })
}

/**
 * DELETE /api/basefm/streams?wallet=WALLET
 * End current session
 */
export async function DELETE(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet required' }, { status: 400 })
  }

  const result = await prisma.dj_sessions.updateMany({
    where: { wallet, status: 'active' },
    data: { status: 'ended', ended_at: new Date() },
  })

  return NextResponse.json({
    success: true,
    ended: result.count,
    message: result.count > 0 ? 'Session ended' : 'No active session found',
  })
}
