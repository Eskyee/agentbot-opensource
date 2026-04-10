import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'

export const COMMUNITY_REWARDS_TOKEN = '9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump'
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL_DEFAULT?.trim() || 'https://api.mainnet-beta.solana.com'
const SOLANA_WALLET_SETTING_KEY = 'solana_rewards_wallet_address'

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

export const COMMUNITY_REWARD_TIERS = [
  { id: 'whale', label: 'Whale', minBalance: 100_000, credits: 1000 },
  { id: 'builder', label: 'Builder', minBalance: 10_000, credits: 250 },
  { id: 'holder', label: 'Holder', minBalance: 1_000, credits: 50 },
] as const

export type CommunityRewardTier = typeof COMMUNITY_REWARD_TIERS[number]

function decodeBase58(input: string): Uint8Array {
  if (!input) throw new Error('Missing base58 value')

  const bytes = [0]
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char)
    if (value < 0) throw new Error('Invalid base58 string')

    let carry = value
    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }

    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  for (const char of input) {
    if (char !== '1') break
    bytes.push(0)
  }

  return Uint8Array.from(bytes.reverse())
}

export async function verifySolanaWalletMessage({
  address,
  message,
  signatureBase64,
}: {
  address: string
  message: string
  signatureBase64: string
}) {
  const publicKey = decodeBase58(address)
  if (publicKey.length !== 32) {
    throw new Error('Invalid Solana public key length')
  }

  const signature = Buffer.from(signatureBase64, 'base64')
  const key = crypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKey)]),
    format: 'der',
    type: 'spki',
  })

  return crypto.verify(null, Buffer.from(message), key, signature)
}

export async function getSolanaTokenBalance(address: string): Promise<{ raw: bigint; ui: number }> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        address,
        { mint: COMMUNITY_REWARDS_TOKEN },
        { encoding: 'jsonParsed' },
      ],
    }),
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Solana RPC error: ${response.status}`)
  }

  const body = await response.json() as {
    result?: {
      value?: Array<{
        account?: {
          data?: {
            parsed?: {
              info?: {
                tokenAmount?: {
                  amount?: string
                  uiAmount?: number
                }
              }
            }
          }
        }
      }>
    }
  }

  const accounts = body.result?.value || []
  const raw = accounts.reduce((sum, account) => {
    const amount = account.account?.data?.parsed?.info?.tokenAmount?.amount || '0'
    return sum + BigInt(amount)
  }, 0n)

  return {
    raw,
    ui: Number(raw) / 1_000_000,
  }
}

export function getCommunityRewardTier(balance: number): CommunityRewardTier | null {
  return COMMUNITY_REWARD_TIERS.find((tier) => balance >= tier.minBalance) || null
}

export async function ensureCreditClaimsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS credit_claims (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL UNIQUE,
      token_address TEXT NOT NULL,
      tier TEXT NOT NULL,
      credits INTEGER NOT NULL,
      balance_raw TEXT NOT NULL,
      balance_ui NUMERIC NOT NULL,
      claim_source TEXT NOT NULL DEFAULT 'solana-community',
      tx_signature TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function getCreditClaimByWallet(walletAddress: string) {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      user_id: string
      wallet_address: string
      tier: string
      credits: number
      created_at: Date
    }>
  >(
    'SELECT id, user_id, wallet_address, tier, credits, created_at FROM credit_claims WHERE wallet_address = $1 LIMIT 1',
    walletAddress
  )

  return rows[0] || null
}

export async function recordCreditClaim(args: {
  userId: string
  walletAddress: string
  tier: CommunityRewardTier
  balanceRaw: bigint
  balanceUi: number
  txSignature?: string | null
}) {
  await ensureCreditClaimsTable()

  const claimId = `cc_${crypto.randomUUID()}`
  await prisma.$transaction([
    prisma.user.update({
      where: { id: args.userId },
      data: { referralCredits: { increment: args.tier.credits } },
    }),
    prisma.userSetting.upsert({
      where: { userId_key: { userId: args.userId, key: SOLANA_WALLET_SETTING_KEY } },
      update: { value: args.walletAddress },
      create: { userId: args.userId, key: SOLANA_WALLET_SETTING_KEY, value: args.walletAddress },
    }),
    prisma.$executeRawUnsafe(
      `INSERT INTO credit_claims (id, user_id, wallet_address, token_address, tier, credits, balance_raw, balance_ui, tx_signature)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      claimId,
      args.userId,
      args.walletAddress,
      COMMUNITY_REWARDS_TOKEN,
      args.tier.id,
      args.tier.credits,
      args.balanceRaw.toString(),
      args.balanceUi,
      args.txSignature || null
    ),
  ])

  return {
    id: claimId,
    walletAddress: args.walletAddress,
    tier: args.tier.id,
    credits: args.tier.credits,
  }
}

export async function getStoredSolanaRewardWallet(userId: string) {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: SOLANA_WALLET_SETTING_KEY } },
  })
  return setting?.value || null
}

export async function getUserCommunityRewardStatus(userId: string) {
  const walletAddress = await getStoredSolanaRewardWallet(userId)
  if (!walletAddress) {
    return {
      connected: false,
      walletAddress: null,
      claimed: false,
      currentTier: null,
      balanceUi: null,
      creditsClaimed: 0,
    }
  }

  const [claim, balance] = await Promise.all([
    getCreditClaimByWallet(walletAddress),
    getSolanaTokenBalance(walletAddress),
  ])

  const tier = getCommunityRewardTier(balance.ui)

  return {
    connected: true,
    walletAddress,
    claimed: Boolean(claim),
    currentTier: tier
      ? {
          id: tier.id,
          label: tier.label,
          credits: tier.credits,
          minBalance: tier.minBalance,
        }
      : null,
    balanceUi: balance.ui,
    creditsClaimed: claim?.credits || 0,
    claimedAt: claim?.created_at?.toISOString?.() || null,
  }
}
