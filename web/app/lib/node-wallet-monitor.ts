import { createPublicClient, http } from 'viem'
import { Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { tempo, tempoTestnet } from 'viem/chains'

const IS_TESTNET = process.env.TEMPO_TESTNET === 'true'
const RPC_URL = process.env.RPC_URL || (IS_TESTNET ? 'https://rpc.moderato.tempo.xyz' : 'https://rpc.tempo.xyz')
const TOKEN_ADDRESS = '0x20c0000000000000000000000000000000000000'
const TOKEN_DECIMALS = 6
const THRESHOLD = Number(process.env.NODE_WALLET_THRESHOLD || '100')
const OPERATOR_FEE_PAYER_KEY =
  (process.env.TEMPO_FEE_PAYER_KEY || process.env.MPP_FEE_PAYER_KEY || '') as `0x${string}`

function getConfiguredWallets(): Address[] {
  const configured = (process.env.TEMPO_NODE_WALLETS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const extraWallets = [
    process.env.TEMPO_FEE_PAYER_ADDRESS?.trim(),
    process.env.TEMPO_TREASURY_WALLET?.trim(),
  ].filter(Boolean) as string[]

  if (OPERATOR_FEE_PAYER_KEY) {
    try {
      extraWallets.push(privateKeyToAccount(OPERATOR_FEE_PAYER_KEY).address)
    } catch {
      // ignore malformed private key
    }
  }

  return [...new Set([...configured, ...extraWallets].map((value) => value.toLowerCase()))] as Address[]
}

const walletList = getConfiguredWallets()

const tempoChain = {
  id: IS_TESTNET ? tempoTestnet.id : tempo.id,
  name: IS_TESTNET ? tempoTestnet.name : tempo.name,
  network: IS_TESTNET ? 'moderato' : 'tempo',
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

export function getWalletMonitorConfig() {
  return {
    rpcUrl: RPC_URL,
    threshold: THRESHOLD,
    addresses: walletList,
    configured: walletList.length > 0,
    chain: tempoChain.name,
  }
}

export async function fetchWalletStatuses(): Promise<WalletStatus[]> {
  if (!walletList.length) return []
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
