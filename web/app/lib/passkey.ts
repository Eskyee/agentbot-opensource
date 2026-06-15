import { prisma } from '@/app/lib/prisma'

const PASSKEY_ORIGIN =
  process.env.PASSKEY_ORIGIN ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000'
const PASSKEY_RP_ID =
  process.env.PASSKEY_RP_ID || new URL(PASSKEY_ORIGIN).hostname
const PASSKEY_NAME = process.env.PASSKEY_RP_NAME || 'Agentbot'
const PASSKEY_CHALLENGE_TTL = Number(process.env.PASSKEY_CHALLENGE_TTL_MS || 5 * 60 * 1000)

export type PasskeyChallengeType = 'register' | 'authenticate'

export async function createPasskeyChallenge(params: {
  challenge: string
  type: PasskeyChallengeType
  userId?: string
  credentialId?: string
}) {
  const expiresAt = new Date(Date.now() + PASSKEY_CHALLENGE_TTL)
  return prisma.passkeyChallenge.create({
    data: {
      challenge: params.challenge,
      type: params.type,
      userId: params.userId,
      credentialId: params.credentialId,
      expiresAt,
      rpId: PASSKEY_RP_ID,
      origin: PASSKEY_ORIGIN,
    },
  })
}

export async function consumePasskeyChallenge(challenge: string, type: PasskeyChallengeType) {
  const record = await prisma.passkeyChallenge.findUnique({ where: { challenge } })
  if (!record || record.type !== type || record.expiresAt < new Date()) {
    return null
  }
  await prisma.passkeyChallenge.delete({ where: { id: record.id } })
  return record
}

export const passkeyConfig = {
  origin: PASSKEY_ORIGIN,
  rpId: PASSKEY_RP_ID,
  name: PASSKEY_NAME,
}
