import { prisma } from '@/app/lib/prisma'
import { generateNonce } from 'siwe'

const WALLET_NONCE_IDENTIFIER = 'wallet-auth'
const WALLET_NONCE_TTL_MS = Number(process.env.WALLET_NONCE_TTL_MS || 10 * 60 * 1000)

export async function issueWalletNonce() {
  const token = generateNonce()
  const expires = new Date(Date.now() + WALLET_NONCE_TTL_MS)

  await prisma.verificationToken.create({
    data: {
      identifier: WALLET_NONCE_IDENTIFIER,
      token,
      expires,
    },
  })

  return token
}

export async function consumeWalletNonce(token: string) {
  if (!token) return false

  // Atomic consume: delete-and-count in a single statement so two concurrent
  // requests carrying the same nonce cannot both pass (no read-then-delete
  // TOCTOU replay window). Matches the atomic-consumption pattern used for
  // invite codes.
  const { count } = await prisma.verificationToken.deleteMany({
    where: {
      token,
      identifier: WALLET_NONCE_IDENTIFIER,
      expires: { gt: new Date() },
    },
  })

  return count === 1
}
