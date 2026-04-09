import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
      { next: { revalidate: 60 } }
    )

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`)
    }

    const data = await res.json()
    const sol = data.solana

    return NextResponse.json({
      price: sol?.usd ?? null,
      change24h: sol?.usd_24h_change ?? null,
      marketCap: sol?.usd_market_cap ?? null,
      volume24h: sol?.usd_24h_vol ?? null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch price'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
