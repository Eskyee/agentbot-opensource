/**
 * Tempo Wallet Client Config
 * 
 * Provides viem clients configured for Tempo chain.
 * Used by wallet components and MPP integration.
 */

import { createPublicClient, createWalletClient, http, formatUnits, parseUnits, type Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { tempo, tempoTestnet } from 'viem/chains'
import { tempoActions, withFeePayer } from 'viem/tempo'

// Chain selection
const useTestnet = process.env.NEXT_PUBLIC_TEMPO_TESTNET === 'true'
export const tempoChain = useTestnet ? tempoTestnet : tempo

const rpcUrl = useTestnet
  ? 'https://rpc.moderato.tempo.xyz'
  : 'https://rpc.tempo.xyz'

// Fee payer URL (our own endpoint)
const feePayerUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/api/fee-payer`
  : 'https://agentbot.raveculture.xyz/api/fee-payer'

/**
 * Public client for reading Tempo chain data
 */
export const tempoPublicClient = createPublicClient({
  chain: tempoChain,
  transport: http(rpcUrl),
})

/**
 * Create a wallet client with fee payer support
 * 
 * This wraps the transport with our fee payer endpoint,
 * so transactions can be gasless for users.
 */
export function createTempoWalletClient(privateKey?: `0x${string}`) {
  const account = privateKey
    ? privateKeyToAccount(privateKey)
    : undefined

  return createWalletClient({
    account,
    chain: tempoChain,
    transport: withFeePayer(
      http(rpcUrl),           // Default transport
      http(feePayerUrl),      // Fee payer transport
    ),
  }).extend(tempoActions())
}

/**
 * Format a pathUSD balance for display
 * pathUSD has 6 decimals
 */
export function formatPathUsd(balance: bigint): string {
  return formatUnits(balance, 6)
}

/**
 * Parse a USD amount to pathUSD units
 */
export function parsePathUsd(amount: string): bigint {
  return parseUnits(amount, 6)
}

// Token addresses
export const TOKENS = {
  pathUSD: '0x20c0000000000000000000000000000000000000' as Address,
  alphaUSD: '0x20c0000000000000000000000000000000000001' as Address,
  betaUSD: '0x20c0000000000000000000000000000000000002' as Address,
  thetaUSD: '0x20c0000000000000000000000000000000000003' as Address,
} as const

// Operator wallet (recipient for payments)
export const OPERATOR_WALLET = '0xYOUR_WALLET_ADDRESS_HERE' as Address
