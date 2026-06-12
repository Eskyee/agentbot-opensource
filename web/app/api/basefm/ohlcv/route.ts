import { NextRequest, NextResponse } from 'next/server'

const BASEFM_POOL = '0xd54464bb6e5a0e1c49beddde0e02cd03e3239a49c71362902d48a034cd119894'

export async function GET(request: NextRequest) {
  const timeframe = request.nextUrl.searchParams.get('timeframe') || '1h'
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10)

  const aggregateMap: Record<string, string> = {
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': '1440',
  }

  const aggregate = aggregateMap[timeframe] || '60'

  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/base/pools/${BASEFM_POOL}/ohlcv/minute?aggregate=${aggregate}&limit=${limit}`,
      { next: { reuse: 60 } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch OHLCV data' }, { status: 502 })
    }

    const data = await res.json()
    const ohlcvList = data?.data?.attributes?.ohlcv_list || []

    const candles = ohlcvList.map((candle: number[]) => ({
      time: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }))

    return NextResponse.json({ candles })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
