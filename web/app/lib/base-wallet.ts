import { base } from 'viem/chains'
import { formatUnits, isAddress, type Address } from 'viem'

export const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
export const BASE_CHAIN = base
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address
export const BASE_SCAN_URL = 'https://basescan.org'
export const BASE_WALLET_EMAIL_RE = /^(0x[a-fA-F0-9]{40})@wallet\.(?:base\.org|agentbot)$/

export type BaseWalletSessionUser = {
  email?: string | null
}

export function getBaseWalletAddressFromSessionUser(user?: BaseWalletSessionUser | null): Address | null {
  const email = user?.email?.trim()
  if (!email) return null

  const match = email.match(BASE_WALLET_EMAIL_RE)
  if (!match) return null

  const address = match[1]
  return isAddress(address) ? (address as Address) : null
}

export function formatTokenBalance(value: bigint, decimals: number, fractionDigits = 4): string {
  const formatted = Number(formatUnits(value, decimals))
  if (!Number.isFinite(formatted)) return '0'
  return formatted.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
}

export function getBaseAddressUrl(address: string): string {
  return `${BASE_SCAN_URL}/address/${address}`
}

export function getBaseTxUrl(hash: string): string {
  return `${BASE_SCAN_URL}/tx/${hash}`
}
