import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Authentication } from '@/lib/webauthx/server'
import { passkeyConfig, consumePasskeyChallenge } from '@/app/lib/passkey'
import { createUserSession, attachSessionCookie } from '@/app/lib/session'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const response = body?.response
  const challenge = body?.challenge

  if (!response || !challenge) {
    return NextResponse.json({ error: 'Missing passkey response or challenge' }, { status: 400 })
  }

  const stored = await consumePasskeyChallenge(challenge, 'authenticate')
  if (!stored?.userId) {
    return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 400 })
  }

  const credentialRecord = await prisma.passkeyCredential.findUnique({
    where: { credentialId: response.id },
  })

  if (!credentialRecord || credentialRecord.userId !== stored.userId) {
    return NextResponse.json({ error: 'Passkey not recognized' }, { status: 404 })
  }

  try {
    const valid = Authentication.verify(response, {
      challenge,
      origin: passkeyConfig.origin,
      rpId: passkeyConfig.rpId,
      publicKey: credentialRecord.publicKey as `0x${string}`,
    })

    if (!valid) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 })
    }

    await prisma.passkeyCredential.update({
      where: { id: credentialRecord.id },
      data: {
        lastUsedAt: new Date(),
        signCount: BigInt(response.signCount ?? credentialRecord.signCount),
      },
    })

    const sessionToken = await createUserSession(credentialRecord.userId)
    const nextResponse = NextResponse.json({ ok: true })
    attachSessionCookie(nextResponse, sessionToken)
    return nextResponse
  } catch (error) {
    console.error('Passkey authentication failed:', error)
    return NextResponse.json({ error: 'Passkey verification error' }, { status: 400 })
  }
}
