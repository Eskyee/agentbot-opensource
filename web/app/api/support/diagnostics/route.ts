import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { readSharedGatewayToken } from '@/app/lib/gateway-token'
import { sendSupportAlert } from '@/app/lib/support-alert'
import { checkServices } from '@/app/lib/service-health'
import { prisma } from '@/app/lib/prisma'
import { DEFAULT_OPENCLAW_GATEWAY_URL } from '@/app/lib/openclaw-config'

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || DEFAULT_OPENCLAW_GATEWAY_URL

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.email.toLowerCase().includes('@')) {
    return NextResponse.json({ error: 'Email required for diagnostics' }, { status: 401 })
  }

  try {
    const [serviceHealth, trialCount, recentErrors] = await Promise.all([
      checkServices(),
      prisma.user.count({
        where: {
          plan: 'free',
          trialEndsAt: { gt: new Date() },
        },
      }),
      prisma.agent.findMany({
        where: { status: 'error' },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, updatedAt: true, status: true },
        take: 5,
      }),
    ])

    const token = readSharedGatewayToken()
    const tokenStatus = token ? 'present' : 'missing'

    if (!token) {
      sendSupportAlert({
        title: 'Diagnostics: missing gateway token',
        message: `User ${session.user.email} requested diagnostics but gateway token is missing`,
        metadata: { trialCount, status: tokenStatus },
      }).catch(() => {})
    }

    return NextResponse.json({
      serviceHealth,
      trialCount,
      tokenStatus,
      recentErrors,
      gatewayUrl: GATEWAY_URL,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Diagnostics] Error', error)
    return NextResponse.json({ error: 'Diagnostics failed' }, { status: 500 })
  }
}
