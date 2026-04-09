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

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record || record.identifier !== WALLET_NONCE_IDENTIFIER || record.expires < new Date()) {
    return false
  }

  await prisma.verificationToken.delete({
    where: { token },
  })

  return true
}
