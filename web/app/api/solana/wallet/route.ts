import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com'
const LAMPORTS_PER_SOL = 1_000_000_000

const KNOWN_MINTS: Record<string, { symbol: string; decimals: number }> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
  'So11111111111111111111111111111111111111112': { symbol: 'WSOL', decimals: 9 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', decimals: 6 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', decimals: 5 },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', decimals: 6 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', decimals: 9 },
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': { symbol: 'stSOL', decimals: 9 },
}

async function rpcCall(rpcUrl: string, method: string, params: unknown[]) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!res.ok) throw new Error(`RPC error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'RPC error')
  return data.result
}

function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const rpcUrl = searchParams.get('rpc') || DEFAULT_RPC

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 })
  }

  try {
    const [balanceResult, tokenResult, accountResult] = await Promise.all([
      rpcCall(rpcUrl, 'getBalance', [address]),
      rpcCall(rpcUrl, 'getTokenAccountsByOwner', [
        address,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ]),
      rpcCall(rpcUrl, 'getAccountInfo', [address, { encoding: 'jsonParsed' }]),
    ])

    const solBalance = (balanceResult?.value ?? 0) / LAMPORTS_PER_SOL

    const tokens = (tokenResult?.value || [])
      .map((ta: { account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number; decimals: number } } } } } }) => {
        const info = ta.account.data.parsed.info
        const mint = info.mint
        const amount = info.tokenAmount.uiAmount
        const known = KNOWN_MINTS[mint]
        return {
          mint,
          symbol: known?.symbol || mint.slice(0, 4) + '...',
          amount,
          decimals: info.tokenAmount.decimals,
        }
      })
      .filter((t: { amount: number }) => t.amount > 0)
      .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount)
      .slice(0, 20)

    const isExecutable = accountResult?.value?.executable ?? false
    const owner = accountResult?.value?.owner ?? null
    const rentEpoch = accountResult?.value?.rentEpoch ?? null

    return NextResponse.json({
      address,
      solBalance,
      tokens,
      accountInfo: { isExecutable, owner, rentEpoch },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch wallet data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
