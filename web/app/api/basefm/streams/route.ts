import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { getCommunityProgramForUser } from '@/app/lib/communityProgram';

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
      obsSettings: {
        server: MUX_RTMP_URL,
        streamKey: stream.stream_key,
        recommended: {
          audioBitrate: '256-320 kbps',
          encoder: 'AAC',
          sampleRate: '44.1 kHz',
          channels: 'Stereo',
        },
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
