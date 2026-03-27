/**
 * Wallet Transactions API — Tempo Chain History
 * 
 * GET /api/wallet/transactions?address=0x...&limit=20
 * 
 * Fetches recent transactions for a wallet address from Tempo.
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

// Operator wallet (our address — incoming payments)
const OPERATOR = '0xYOUR_WALLET_ADDRESS_HERE'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address') as Address | null
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!address) {
    return NextResponse.json(
      { error: 'Missing address parameter' },
      { status: 400 }
    )
  }

  try {
    // Get current block number for recent history
    const blockNumber = await client.getBlockNumber()
    
    // Fetch recent blocks to find transactions involving this address
    // In production, you'd use an indexer (e.g., Tempo block explorer API)
    // For now, return a placeholder structure
    
    return NextResponse.json({
      address,
      chain: chain.name,
      chainId: chain.id,
      currentBlock: blockNumber.toString(),
      transactions: [],
      note: 'Transaction history requires indexer integration. Use Tempo block explorer for now.',
      explorerUrl: useTestnet
        ? `https://explore.testnet.tempo.xyz/address/${address}`
        : `https://explore.tempo.xyz/address/${address}`,
    })
  } catch (error) {
    console.error('[Wallet Transactions API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
