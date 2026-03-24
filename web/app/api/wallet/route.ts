/**
 * Wallet API — Tempo Balance
 * 
 * GET  /api/wallet?address=0x...  → Balance, fee token info
 * 
 * Queries Tempo RPC for user wallet state.
 */

import { NextResponse } from 'next/server'
import { createPublicClient, http, formatUnits, type Address } from 'viem'
import { tempo, tempoTestnet } from 'viem/chains'
import { tempoActions } from 'viem/tempo'

const useTestnet = process.env.TEMPO_TESTNET === 'true'
const chain = useTestnet ? tempoTestnet : tempo
const rpcUrl = useTestnet
  ? 'https://rpc.moderato.tempo.xyz'
  : 'https://rpc.tempo.xyz'

const client = createPublicClient({
  chain,
  transport: http(rpcUrl),
}).extend(tempoActions())

// pathUSD address
const PATH_USD = '0x20c0000000000000000000000000000000000000' as Address

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
    // Get user's configured fee token
    const userFeeToken = await client.fee.getUserToken({ account: address })
    const feeTokenAddress = userFeeToken?.address ?? PATH_USD

    // Get balance for fee token and pathUSD in parallel
    const [feeTokenBalance, pathUsdBalance] = await Promise.all([
      client.token.getBalance({ account: address, token: feeTokenAddress }),
      client.token.getBalance({ account: address, token: PATH_USD }),
    ])

    return NextResponse.json({
      address,
      chain: chain.name,
      chainId: chain.id,
      testnet: useTestnet,
      feeToken: {
        address: feeTokenAddress,
        balance: formatUnits(feeTokenBalance, 6),
        balanceRaw: feeTokenBalance.toString(),
      },
      pathUsd: {
        address: PATH_USD,
        balance: formatUnits(pathUsdBalance, 6),
        balanceRaw: pathUsdBalance.toString(),
      },
    })
  } catch (error) {
    console.error('[Wallet API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    )
  }
}
