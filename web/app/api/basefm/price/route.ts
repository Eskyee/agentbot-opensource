import { NextResponse } from 'next/server'

const BASEFM_ADDRESS = '0x9a4376bab717ac0a3901eeed8308a420c59c0ba3'

export const dynamic = 'force-dynamic'

interface DexScreenerPair {
  priceUsd: string
  priceChange: { h1: number; h24: number; d7: number }
  volume: { h1: number; h24: number }
  liquidity: { usd: number }
  fdv: number
  marketCap: number
  pairCreatedAt: number
  baseToken: { name: string; symbol: string }
  quoteToken: { name: string; symbol: string }
}

export async function GET() {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${BASEFM_ADDRESS}`,
      { next: { revalidate: 30 } },
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch price' }, { status: 502 })
    }

    const data = await res.json()
    const pair: DexScreenerPair | undefined = data.pairs?.[0]

    if (!pair) {
      return NextResponse.json({
        price: 0,
        priceUsd: '$0.00',
        change24h: 0,
        change7d: 0,
        volume24h: 0,
        liquidity: 0,
        fdv: 0,
        pairAddress: null,
        dexId: null,
      })
    }

    const price = parseFloat(pair.priceUsd) || 0
    const change24h = pair.priceChange?.h24 ?? 0
    const change7d = pair.priceChange?.d7 ?? 0
    const volume24h = pair.volume?.h24 ?? 0
    const liquidity = pair.liquidity?.usd ?? 0
    const fdv = pair.fdv ?? 0

    return NextResponse.json({
      price,
      priceUsd: price < 0.000001 ? `$${price.toExponential(2)}` : `$${price.toFixed(8)}`,
      change24h,
      change7d,
      volume24h,
      liquidity,
      fdv,
      pairAddress: pair.pairAddress ?? null,
      dexId: pair.dexId ?? null,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Price fetch failed' }, { status: 500 })
  }
}
