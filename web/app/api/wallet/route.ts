/**
 * Wallet API — Tempo Balance
 *
 * GET  /api/wallet?address=0x...  → Balance, fee token info
 *
 * Queries Tempo RPC for user wallet state.
 */

import { NextResponse } from 'next/server'
import { createPublicClient, http, formatUnits, parseAbi, type Address } from 'viem'
import { tempo, tempoTestnet } from 'viem/chains'

const useTestnet = process.env.TEMPO_TESTNET === 'true'
const chain = useTestnet ? tempoTestnet : tempo
const rpcUrl = useTestnet
  ? 'https://rpc.moderato.tempo.xyz'
  : 'https://rpc.tempo.xyz'

const client = createPublicClient({
  chain,
  transport: http(rpcUrl),
})

// All known tokens on Tempo (from official tokenlist)
const KNOWN_TOKENS = {
  pathUSD: '0x20c0000000000000000000000000000000000000' as Address,
  alphaUSD: '0x20c0000000000000000000000000000000000001' as Address,
  betaUSD: '0x20c0000000000000000000000000000000000002' as Address,
  thetaUSD: '0x20c0000000000000000000000000000000000003' as Address,
  'USDC.e': '0x20c000000000000000000000b9537d11c60e8b50' as Address,
  'EURC.e': '0x20c0000000000000000000001621e21f71cf12fb' as Address,
  USDT0: '0x20c00000000000000000000014f22ca97301eb73' as Address,
  frxUSD: '0x20c0000000000000000000003554d28269e0f3c2' as Address,
  cUSD: '0x20c0000000000000000000000520792dcccccccc' as Address,
  stcUSD: '0x20c0000000000000000000008ee4fcff88888888' as Address,
  GUSD: '0x20c0000000000000000000005c0bac7cef389a11' as Address,
}

// ERC20 ABI for balance and metadata
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
])

/**
 * Query balance for a specific token
 */
async function getTokenBalance(tokenAddress: Address, account: Address) {
  try {
    const [balance, name, symbol, decimals] = await Promise.all([
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [account] }),
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'name' }).catch(() => 'Unknown'),
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => '???'),
      client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => 6),
    ])
    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      balance: formatUnits(balance, decimals),
      balanceRaw: balance.toString(),
      hasBalance: balance > 0n,
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address') as Address | null

  if (!address) {
    return NextResponse.json(
      { error: 'Missing address parameter' },
      { status: 400 }
    )
  }

  try {
    // Query all known tokens in parallel
    const tokenResults = await Promise.all(
      Object.entries(KNOWN_TOKENS).map(async ([name, tokenAddr]) => {
        const data = await getTokenBalance(tokenAddr, address)
        return { name, ...data }
      })
    )

    // Find tokens with balances > 0
    const fundedTokens = tokenResults.filter(t => t?.hasBalance)

    // Primary token: first funded one, or pathUSD as default
    const primary = fundedTokens[0] || tokenResults[0]

    // Calculate total USD value (all tokens are 1:1 USD pegged)
    const totalUsd = fundedTokens.reduce((sum, t) => {
      return sum + parseFloat(t?.balance || '0')
    }, 0)

    return NextResponse.json({
      address,
      chain: chain.name,
      chainId: chain.id,
      testnet: useTestnet,
      totalUsd: totalUsd.toFixed(2),
      primaryToken: primary ? {
        address: primary.address,
        name: primary.name,
        symbol: primary.symbol,
        decimals: primary.decimals,
        balance: primary.balance,
      } : null,
      allTokens: tokenResults.filter(t => t?.hasBalance).map(t => ({
        address: t!.address,
        name: t!.name,
        symbol: t!.symbol,
        balance: t!.balance,
      })),
    })
  } catch (error) {
    console.error('[Wallet API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    )
  }
}
