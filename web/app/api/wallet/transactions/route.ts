import { NextResponse } from 'next/server'
import { createPublicClient, formatUnits, http, isAddress, parseAbiItem, type Address } from 'viem'
import { BASE_CHAIN, BASE_RPC_URL, BASE_USDC_ADDRESS, getBaseTxUrl } from '@/app/lib/base-wallet'

const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 25
const LOOKBACK_BLOCKS = 50_000n

const client = createPublicClient({
  chain: BASE_CHAIN,
  transport: http(BASE_RPC_URL),
})

type WalletTransaction = {
  hash: string
  direction: 'sent' | 'received'
  symbol: 'USDC'
  amount: string
  amountRaw: string
  from: string
  to: string
  blockNumber: string
  timestamp: string
  status: 'confirmed'
  explorerUrl: string
}

function toAddress(value: string | null): Address | null {
  return value && isAddress(value) ? (value as Address) : null
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
    const fromBlock = currentBlock > LOOKBACK_BLOCKS ? currentBlock - LOOKBACK_BLOCKS : 0n

    const [incomingLogs, outgoingLogs] = await Promise.all([
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
    ])

    const merged = [...incomingLogs, ...outgoingLogs]
      .sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return Number((b.logIndex ?? 0) - (a.logIndex ?? 0))
        }
        return Number(b.blockNumber - a.blockNumber)
      })
      .slice(0, limit)

    const blockNumbers = [...new Set(merged.map((log) => log.blockNumber.toString()))]
    const blocks = await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        const block = await client.getBlock({ blockNumber: BigInt(blockNumber) })
        return [blockNumber, block] as const
      })
    )
    const blockMap = new Map(blocks)

    const transactions: WalletTransaction[] = merged.map((log) => {
      const block = blockMap.get(log.blockNumber.toString())
      const from = log.args.from ?? ''
      const to = log.args.to ?? ''
      const value = log.args.value ?? 0n

      return {
        hash: log.transactionHash,
        direction: to.toLowerCase() === address.toLowerCase() ? 'received' : 'sent',
        symbol: 'USDC',
        amount: formatUnits(value, 6),
        amountRaw: value.toString(),
        from,
        to,
        blockNumber: log.blockNumber.toString(),
        timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date(0).toISOString(),
        status: 'confirmed',
        explorerUrl: getBaseTxUrl(log.transactionHash),
      }
    })

    return NextResponse.json({
      address,
      chain: BASE_CHAIN.name,
      chainId: BASE_CHAIN.id,
      currentBlock: currentBlock.toString(),
      indexedAsset: 'USDC',
      windowBlocks: LOOKBACK_BLOCKS.toString(),
      transactions,
    })
  } catch (error) {
    console.error('[Wallet Transactions API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
