/**
 * GET /api/bridge/status — Check if the user's bridge is connected.
 *
 * Returns connected/disconnected and when the bridge was last seen.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { connectedBridges } from '@/app/api/bridge/poll/route'

export async function GET(_request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bridgeSecret: true },
  })

  if (!user?.bridgeSecret) {
    return NextResponse.json({ connected: false, hasSecret: false })
  }

  const bridge = connectedBridges.get(user.bridgeSecret)
  const isRecent = bridge && (Date.now() - bridge.lastSeen < 15_000) // 15s threshold

  return NextResponse.json({
    connected: !!isRecent,
    hasSecret: true,
    lastSeen: bridge?.lastSeen ?? null,
  })
}
