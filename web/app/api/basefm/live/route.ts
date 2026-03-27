import { NextResponse } from 'next/server';

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

interface MuxLiveStream {
  id: string;
  stream_key: string;
  status: 'active' | 'idle' | 'disabled';
  playback_ids?: Array<{ id: string; policy: string }>;
  metadata?: {
    dj_wallet?: string;
    dj_name?: string;
  };
  created_at: number;
}

export async function GET() {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json(
      { error: 'Mux not configured' },
      { status: 500 }
    );
  }

  try {
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');
    
    const response = await fetch('https://api.mux.com/video/v1/live-streams?status=active&limit=100', {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mux API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch streams from Mux' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const streams: MuxLiveStream[] = data.data || [];

    const liveDJs = streams
      .filter(stream => stream.status === 'active')
      .map(stream => ({
        id: stream.id,
        name: stream.metadata?.dj_name || 'Anonymous DJ',
        wallet: stream.metadata?.dj_wallet || null,
        playbackId: stream.playback_ids?.[0]?.id || null,
        streamKey: stream.stream_key,
        status: stream.status,
        startedAt: stream.created_at,
        hlsUrl: stream.playback_ids?.[0]?.id 
          ? `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8`
          : null,
        embedUrl: stream.playback_ids?.[0]?.id
          ? `https://stream.mux.com/${stream.playback_ids[0].id}.html`
          : null,
      }));

    return NextResponse.json({
      djs: liveDJs,
      count: liveDJs.length,
    });
  } catch (error) {
    console.error('Error fetching live DJs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
