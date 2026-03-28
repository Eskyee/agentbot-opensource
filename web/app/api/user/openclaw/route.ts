import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openclawUrl: true, openclawInstanceId: true },
  })

  return NextResponse.json({
    openclawUrl: user?.openclawUrl || null,
    openclawInstanceId: user?.openclawInstanceId || null,
    // Gateway token is the same for all agents (platform-level auth)
    gatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN || null,
  })
}

export const dynamic = 'force-dynamic'
