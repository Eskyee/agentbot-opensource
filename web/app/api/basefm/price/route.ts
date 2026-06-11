import { NextResponse } from 'next/server'

const BASEFM_POOL = '0xd54464bb6e5a0e1c49beddde0e02cd03e3239a49c71362902d48a034cd119894'

export const dynamic = 'force-dynamic'

interface GeckoPoolResponse {
  data: {
    attributes: {
      base_token_price_usd: string
      price_change_percentage: { h1: string; h24: string; h6: string }
      volume_usd: { h24: string; h1: string }
      reserve_in_usd: string
      fdv_usd: string
      transactions: { h24: { buys: number; sells: number } }
      name: string
    }
  }
}

export async function GET() {
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/base/pools/${BASEFM_POOL}`,
      { next: { revalidate: 15 } },
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch price' }, { status: 502 })
    }

    const data: GeckoPoolResponse = await res.json()
    const attrs = data.data.attributes

    const price = parseFloat(attrs.base_token_price_usd) || 0
    const change24h = parseFloat(attrs.price_change_percentage?.h24) || 0
    const change1h = parseFloat(attrs.price_change_percentage?.h1) || 0
    const volume24h = parseFloat(attrs.volume_usd?.h24) || 0
    const liquidity = parseFloat(attrs.reserve_in_usd) || 0
    const fdv = parseFloat(attrs.fdv_usd) || 0
    const buys = attrs.transactions?.h24?.buys || 0
    const sells = attrs.transactions?.h24?.sells || 0

    // Format price as readable USD (no scientific notation)
    const formatPrice = (p: number): string => {
      if (p === 0) return '$0.00'
      if (p >= 1) return `$${p.toFixed(2)}`
      if (p >= 0.01) return `$${p.toFixed(4)}`
      // Show leading zeros for micro-cap tokens
      const str = p.toFixed(20)
      const match = str.match(/^0\.(0+)(\d{4})/)
      if (match) {
        const zeros = match[1].length
        const significant = match[2]
        return `$0.${'0'.repeat(zeros)}${significant}`
      }
      return `$${p.toExponential(2)}`
    }

    return NextResponse.json({
      price,
      priceUsd: formatPrice(price),
      change24h,
      change1h,
      volume24h,
      liquidity,
      fdv,
      buys,
      sells,
      poolName: attrs.name,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Price fetch failed' }, { status: 500 })
  }
}
