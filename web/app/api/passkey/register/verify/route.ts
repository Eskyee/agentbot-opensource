import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { Registration } from '@/lib/webauthx/server'
import { passkeyConfig, consumePasskeyChallenge } from '@/app/lib/passkey'

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const credential = body?.credential
  const challenge = body?.challenge
  const label = body?.label || 'Passkey'

  if (!credential || !challenge) {
    return NextResponse.json({ error: 'Missing credential or challenge' }, { status: 400 })
  }

  const stored = await consumePasskeyChallenge(challenge, 'register')
  if (!stored || stored.userId !== session.user.id) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 400 })
  }

  try {
    const verified = Registration.verify(credential, {
      challenge,
      origin: passkeyConfig.origin,
      rpId: passkeyConfig.rpId,
    })

    const credentialId = verified.credential.id
    const existing = await prisma.passkeyCredential.findUnique({
      where: { credentialId },
    })

    if (existing) {
      return NextResponse.json({ error: 'Passkey already registered' }, { status: 400 })
    }

    await prisma.passkeyCredential.create({
      data: {
        userId: session.user.id,
        credentialId,
        publicKey: verified.credential.publicKey,
        signCount: BigInt((verified.credential as any).signCount ?? 0),
        transports: (verified.credential as any).transports?.join(','),
        name: label,
        lastUsedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Passkey registration failed:', error)
    return NextResponse.json({ error: 'Passkey verification failed' }, { status: 400 })
  }
}
