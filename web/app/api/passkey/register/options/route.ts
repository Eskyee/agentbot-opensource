import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { Registration } from '@/lib/webauthx/server'
import { Buffer } from 'buffer'
import { createPasskeyChallenge, passkeyConfig } from '@/app/lib/passkey'

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  const existingCredentials = await prisma.passkeyCredential.findMany({
    where: { userId: session.user.id },
  })

  const displayName =
    user?.name || user?.email || session.user.id

  const { challenge, options } = Registration.getOptions({
    rp: { id: passkeyConfig.rpId, name: passkeyConfig.name },
    user: {
      id: Buffer.from(session.user.id),
      name: user?.email || session.user.id,
      displayName,
    },
    excludeCredentialIds: existingCredentials.map((credential) => credential.credentialId),
    attestation: 'none',
    authenticatorSelection: {
      userVerification: 'required',
    },
    timeout: 60_000,
  })

  await createPasskeyChallenge({
    challenge,
    type: 'register',
    userId: session.user.id,
  })

  return NextResponse.json({ options, challenge })
}
