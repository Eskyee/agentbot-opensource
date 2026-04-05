import { NextResponse } from 'next/server'
import { createPublicClient, formatEther, formatUnits, http, isAddress, parseAbiItem, type Address, type Transaction } from 'viem'
import { BASE_CHAIN, BASE_RPC_URL, BASE_USDC_ADDRESS, getBaseTxUrl } from '@/app/lib/base-wallet'

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 25
const USDC_LOOKBACK_BLOCKS = 50_000n
const ETH_SCAN_MAX_BLOCKS = 180

const client = createPublicClient({
  chain: BASE_CHAIN,
  transport: http(BASE_RPC_URL),
})

type WalletTransaction = {
  hash: string
  asset: 'USDC' | 'ETH'
  direction: 'sent' | 'received'
  amount: string
  amountRaw: string
  from: string
  to: string
  blockNumber: string
  timestamp: string
  status: 'confirmed'
  explorerUrl: string
  source: 'token-log' | 'recent-native-scan'
}

function toAddress(value: string | null): Address | null {
  return value && isAddress(value) ? (value as Address) : null
}

async function getRecentNativeTransactions(address: Address, limit: number): Promise<WalletTransaction[]> {
  const currentBlock = await client.getBlockNumber()
  const target = address.toLowerCase()
  const results: WalletTransaction[] = []

  for (let offset = 0; offset < ETH_SCAN_MAX_BLOCKS && results.length < limit; offset += 1) {
    const blockNumber = currentBlock - BigInt(offset)
    if (blockNumber < 0n) break

    const block = await client.getBlock({
      blockNumber,
      includeTransactions: true,
    })

    for (const tx of block.transactions as Transaction[]) {
      if (!tx.to || tx.value <= 0n) continue

      const from = tx.from.toLowerCase()
      const to = tx.to.toLowerCase()
      if (from !== target && to !== target) continue

      results.push({
        hash: tx.hash,
        asset: 'ETH',
        direction: to === target ? 'received' : 'sent',
        amount: formatEther(tx.value),
        amountRaw: tx.value.toString(),
        from: tx.from,
        to: tx.to,
        blockNumber: block.number.toString(),
        timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        status: 'confirmed',
        explorerUrl: getBaseTxUrl(tx.hash),
        source: 'recent-native-scan',
      })

      if (results.length >= limit) break
    }
  }

  return results
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = toAddress(searchParams.get('address'))
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || DEFAULT_LIMIT), 1), MAX_LIMIT)

  if (!address) {
    return NextResponse.json({ error: 'Valid address parameter required' }, { status: 400 })
  }

  try {
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > USDC_LOOKBACK_BLOCKS ? currentBlock - USDC_LOOKBACK_BLOCKS : 0n

    const [incomingLogs, outgoingLogs, nativeTransactions] = await Promise.all([
      client.getLogs({
        address: BASE_USDC_ADDRESS,
        event: TRANSFER_EVENT,
        args: { to: address },
        fromBlock,
        toBlock: currentBlock,
      }),
      client.getLogs({
        address: BASE_USDC_ADDRESS,
        event: TRANSFER_EVENT,
        args: { from: address },
        fromBlock,
        toBlock: currentBlock,
      }),
      getRecentNativeTransactions(address, limit),
    ])

    const usdcLogs = [...incomingLogs, ...outgoingLogs]
      .sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return Number((b.logIndex ?? 0) - (a.logIndex ?? 0))
        }
        return Number(b.blockNumber - a.blockNumber)
      })
      .slice(0, limit)

    const blockNumbers = [...new Set(usdcLogs.map((log) => log.blockNumber.toString()))]
    const blocks = await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        const block = await client.getBlock({ blockNumber: BigInt(blockNumber) })
        return [blockNumber, block] as const
      })
    )
    const blockMap = new Map(blocks)

    const usdcTransactions: WalletTransaction[] = usdcLogs.map((log) => {
      const block = blockMap.get(log.blockNumber.toString())
      const from = log.args.from ?? ''
      const to = log.args.to ?? ''
      const value = log.args.value ?? 0n

      return {
        hash: log.transactionHash,
        asset: 'USDC',
        direction: to.toLowerCase() === address.toLowerCase() ? 'received' : 'sent',
        amount: formatUnits(value, 6),
        amountRaw: value.toString(),
        from,
        to,
        blockNumber: log.blockNumber.toString(),
        timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date(0).toISOString(),
        status: 'confirmed',
        explorerUrl: getBaseTxUrl(log.transactionHash),
        source: 'token-log',
      }
    })

    const transactions = [...usdcTransactions, ...nativeTransactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      address,
      chain: BASE_CHAIN.name,
      chainId: BASE_CHAIN.id,
      currentBlock: currentBlock.toString(),
      transactions,
      sources: {
        usdc: `token logs over last ${USDC_LOOKBACK_BLOCKS.toString()} blocks`,
        eth: `native scan over last ${ETH_SCAN_MAX_BLOCKS} blocks`,
      },
    })
  } catch (error) {
    console.error('[Wallet Transactions API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
