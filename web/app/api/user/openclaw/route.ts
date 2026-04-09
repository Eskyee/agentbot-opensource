import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { getOrCreateUserGatewayToken } from '@/app/lib/token-manager'
import { maybeAutoSyncManagedRuntimeForUser } from '@/app/lib/managed-runtime-sync'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await maybeAutoSyncManagedRuntimeForUser(session.user.id).catch(() => {})

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openclawUrl: true, openclawInstanceId: true },
  })

  // Get the user's own gateway token (unique per agent)
  const tokenResult = await getOrCreateUserGatewayToken(session.user.id)
  const userGatewayToken = tokenResult?.token || null

  return NextResponse.json({
    openclawUrl: user?.openclawUrl || null,
    openclawInstanceId: user?.openclawInstanceId || null,
    gatewayToken: userGatewayToken,
  })
}

export const dynamic = 'force-dynamic'
