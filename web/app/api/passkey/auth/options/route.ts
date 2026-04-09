import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Authentication } from '@/lib/webauthx/server'
import { createPasskeyChallenge, passkeyConfig } from '@/app/lib/passkey'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const identifier = (body?.identifier as string | undefined)?.trim().toLowerCase()

  if (!identifier) {
    return NextResponse.json({ error: 'Missing identifier' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: {
      email: identifier,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const credentials = await prisma.passkeyCredential.findMany({
    where: { userId: user.id },
  })

  if (!credentials.length) {
    return NextResponse.json({ error: 'No passkeys registered' }, { status: 404 })
  }

  const { challenge, options } = Authentication.getOptions({
    credentialId: credentials.map((c) => c.credentialId),
    rpId: passkeyConfig.rpId,
    userVerification: 'required',
  })

  await createPasskeyChallenge({
    challenge,
    type: 'authenticate',
    userId: user.id,
  })

  return NextResponse.json({ options, challenge })
}
