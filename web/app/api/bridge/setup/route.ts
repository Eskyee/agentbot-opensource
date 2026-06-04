/**
 * POST /api/bridge/setup — Generate or retrieve a bridge secret for the current user.
 *
 * Returns the secret and the one-liner command to connect.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'

export async function POST(_request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bridgeSecret: true },
  })

  let secret = user?.bridgeSecret

  if (!secret) {
    // Generate a new secret
    secret = crypto.randomBytes(32).toString('hex')
    await prisma.user.update({
      where: { id: session.user.id },
      data: { bridgeSecret: secret },
    })
  }

  const command = `BRIDGE_SECRET=${secret} bash <(curl -sSL https://agentbot.sh/bridge/install.sh)`

  return NextResponse.json({ secret, command })
}

export async function DELETE(_request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bridgeSecret: null },
  })

  return NextResponse.json({ ok: true })
}
