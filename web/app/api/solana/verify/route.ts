import { NextRequest, NextResponse } from 'next/server'

const SOLANA_TOKEN = '9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump'
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'

export const dynamic = 'force-dynamic'

/**
 * GET /api/solana/verify?address=SOLANA_WALLET
 * Verify Solana Agentbot token balance for baseFM holder benefits
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')

  if (!address || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }

  try {
    const res = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [address, { mint: SOLANA_TOKEN }, { encoding: 'jsonParsed' }],
      }),
    })

    const data = await res.json()
    const accounts = data?.result?.value || []

    let balance = 0
    for (const account of accounts) {
      const amount = account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0
      balance += amount
    }

    // Holder benefits tiers
    const benefits = []
    if (balance >= 1_000) benefits.push({ tier: 'Holder', perk: 'Access to exclusive baseFM DJ streams' })
    if (balance >= 10_000) benefits.push({ tier: 'Builder', perk: 'Early access to new features + premium playlists' })
    if (balance >= 100_000) benefits.push({ tier: 'Whale', perk: 'VIP community chat + voting rights + revenue share' })

    return NextResponse.json({
      address,
      token: SOLANA_TOKEN,
      balance,
      eligible: balance >= 1_000,
      benefits,
      tiers: [
        { name: 'Holder', min: 1_000, credits: 50, basefm: 'Exclusive DJ streams' },
        { name: 'Builder', min: 10_000, credits: 100, basefm: 'Early features + premium playlists' },
        { name: 'Whale', min: 100_000, credits: 200, basefm: 'VIP chat + voting + revenue share' },
      ],
    })
  } catch (error) {
    console.error('[Solana Verify] Error:', error)
    return NextResponse.json({ error: 'RPC error' }, { status: 502 })
  }
}
