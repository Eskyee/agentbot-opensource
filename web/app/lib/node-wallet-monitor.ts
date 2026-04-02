import { createPublicClient, http } from 'viem'
import { Address } from 'viem'

const RPC_URL = process.env.RPC_URL || 'https://rpc.moderato.tempo.xyz'
const TOKEN_ADDRESS = '0x20c0000000000000000000000000000000000000'
const TOKEN_DECIMALS = 6
const THRESHOLD = Number(process.env.NODE_WALLET_THRESHOLD || '100')

const walletList = (
  process.env.TEMPO_NODE_WALLETS || ''
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => value as Address)

const tempoChain = {
  id: 42431,
  name: 'Tempo Moderato',
  network: 'moderato',
  nativeCurrency: { name: 'pathUSD', symbol: 'pathUSD', decimals: TOKEN_DECIMALS },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
}

const client = createPublicClient({
  transport: http(RPC_URL),
  chain: tempoChain,
})

export interface WalletStatus {
  address: Address
  balance: bigint
  formatted: number
  healthy: boolean
  threshold: number
}

export async function fetchWalletStatuses(): Promise<WalletStatus[]> {
  return Promise.all(
    walletList.map(async (address) => {
      const balance = await client.readContract({
        address: TOKEN_ADDRESS,
        abi: [{ type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
        functionName: 'balanceOf',
        args: [address],
      })
      const formatted = Number(balance) / Math.pow(10, TOKEN_DECIMALS)
      return {
        address,
        balance,
        formatted,
        threshold: THRESHOLD,
        healthy: formatted >= THRESHOLD,
      }
    })
  )
}

export function getWalletAlertCommand(address: Address, amount?: number) {
  const amt = amount ?? Math.max(THRESHOLD * 2, THRESHOLD + 50)
  return `Transfer ${amt.toFixed(2)} pathUSD to ${address} via your treasury wallet on Tempo Moderato.`
}
