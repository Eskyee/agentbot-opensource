const DEXSCREENER_TOKEN_API = 'https://api.dexscreener.com/tokens/v1/solana'
const SOLSCAN_TOKEN_META_API = 'https://pro-api.solscan.io/v2.0/token/meta'

export const COMMUNITY_TOKEN = {
  name: 'Agentbot',
  symbol: 'AGENTBOT',
  network: 'Solana',
  dex: 'Pump.fun',
  address: '9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump',
  maxTotalSupply: 998_890_004,
  circulatingSupply: 998_890_004,
  decimals: 6,
  tokenExtension: true,
  ownerProgram: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  creationTimeLabel: 'April 8, 2026, 05:27:48',
  holdersFallback: 49,
  pumpFunUrl: 'https://pump.fun/9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump',
  dexScreenerUrl: 'https://dexscreener.com/solana/l3lctrhv2geqzkrgccqqczqmuutgt6hklnpqv4fmhcp',
  solscanUrl: 'https://solscan.io/token/9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump',
  solscanPairUrl: 'https://solscan.io/account/L3LcTrHV2gEQzKrgcCQqCzQMuuTGt6HkLNPQv4fMhcP',
  oklinkUrl: 'https://www.oklink.com/solana/token/9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump',
} as const

interface DexScreenerPair {
  chainId?: string
  dexId?: string
  url?: string
  pairAddress?: string
  priceUsd?: string | null
  priceNative?: string | null
  volume?: {
    h24?: number | string
  }
  liquidity?: {
    usd?: number | string
  }
  fdv?: number | string | null
  marketCap?: number | string | null
}

interface LiveTokenStats {
  priceUsd: number | null
  priceNative: number | null
  marketCapUsd: number | null
  volume24hUsd: number | null
  liquidityUsd: number | null
  holders: number | null
  status: 'GRADUATED' | 'WATCHING'
  progress: number | null
  pairUrl: string
  pairAddress: string | null
  holdersSource: 'solscan' | 'unavailable'
  statusNote: string
  updatedAt: string
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

async function fetchDexScreenerStats(): Promise<{
  priceUsd: number | null
  priceNative: number | null
  marketCapUsd: number | null
  volume24hUsd: number | null
  liquidityUsd: number | null
  pairUrl: string
  pairAddress: string | null
  hasLivePair: boolean
}> {
  const response = await fetch(`${DEXSCREENER_TOKEN_API}/${COMMUNITY_TOKEN.address}`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status}`)
  }

  const pairs = (await response.json()) as DexScreenerPair[]
  const bestPair = [...pairs]
    .filter((pair) => pair.chainId === 'solana')
    .sort((a, b) => (asNumber(b.liquidity?.usd) ?? 0) - (asNumber(a.liquidity?.usd) ?? 0))[0]

  return {
    priceUsd: asNumber(bestPair?.priceUsd),
    priceNative: asNumber(bestPair?.priceNative),
    marketCapUsd: asNumber(bestPair?.marketCap) ?? asNumber(bestPair?.fdv),
    volume24hUsd: asNumber(bestPair?.volume?.h24),
    liquidityUsd: asNumber(bestPair?.liquidity?.usd),
    pairUrl: bestPair?.url || COMMUNITY_TOKEN.dexScreenerUrl,
    pairAddress: bestPair?.pairAddress || null,
    hasLivePair: Boolean(bestPair),
  }
}

async function fetchSolscanHolders(): Promise<{ holders: number | null; source: 'solscan' | 'unavailable' }> {
  const apiKey = process.env.SOLSCAN_API_KEY?.trim()
  if (!apiKey) {
    return { holders: null, source: 'unavailable' }
  }

  const response = await fetch(`${SOLSCAN_TOKEN_META_API}?address=${COMMUNITY_TOKEN.address}`, {
    headers: {
      accept: 'application/json',
      token: apiKey,
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    return { holders: null, source: 'unavailable' }
  }

  const body = await response.json() as {
    data?: { holder?: number | string }
    holder?: number | string
  }

  return {
    holders: asNumber(body.data?.holder) ?? asNumber(body.holder),
    source: 'solscan',
  }
}

export async function getCommunityTokenStats(): Promise<LiveTokenStats> {
  const [dexResult, holdersResult] = await Promise.allSettled([
    fetchDexScreenerStats(),
    fetchSolscanHolders(),
  ])

  const dex = dexResult.status === 'fulfilled'
    ? dexResult.value
    : {
        priceUsd: null,
        priceNative: null,
        marketCapUsd: null,
        volume24hUsd: null,
        liquidityUsd: null,
        pairUrl: COMMUNITY_TOKEN.dexScreenerUrl,
        pairAddress: null,
        hasLivePair: false,
      }

  const holders = holdersResult.status === 'fulfilled'
    ? holdersResult.value
    : { holders: null, source: 'unavailable' as const }

  const graduated = dex.hasLivePair

  return {
    priceUsd: dex.priceUsd,
    priceNative: dex.priceNative,
    marketCapUsd: dex.marketCapUsd,
    volume24hUsd: dex.volume24hUsd,
    liquidityUsd: dex.liquidityUsd,
    holders: holders.holders ?? COMMUNITY_TOKEN.holdersFallback,
    holdersSource: holders.source,
    status: graduated ? 'GRADUATED' : 'WATCHING',
    progress: graduated ? 100 : null,
    pairUrl: dex.pairUrl,
    pairAddress: dex.pairAddress,
    statusNote: graduated
      ? 'Live market listing detected on DexScreener.'
      : 'No live market pair detected yet.',
    updatedAt: new Date().toISOString(),
  }
}
