import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { readSharedGatewayToken } from '@/app/lib/gateway-token'
import { logTokenSanitization } from '@/app/lib/token-logger'
import { checkServices } from '@/app/lib/service-health'
import { sendSupportAlert } from '@/app/lib/support-alert'

export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = readSharedGatewayToken()
  const health = await checkServices([{ name: 'OpenClaw Gateway', url: `${process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'https://openclaw-gw-ui-production.up.railway.app'}/health` }])
  const gatewayHealth = health[0]
  const status = gatewayHealth?.status || 'down'

  if (!token) {
    const message = 'Gateway token is missing; support has been alerted.'
    sendSupportAlert({ title: 'Auto Pair healing failed', message, metadata: { user: session.user.email, status } }).catch(() => {})
    return NextResponse.json({
      healed: false,
      message,
      health: gatewayHealth,
    }, { status: 500 })
  }

  logTokenSanitization('support-heal', process.env.OPENCLAW_GATEWAY_TOKEN, token)

  if (status !== 'ok') {
    sendSupportAlert({
      title: 'Gateway health degraded during healing',
      message: `Auto Pair health check returned ${status}`,
      metadata: { user: session.user.email, detail: gatewayHealth.detail },
    }).catch(() => {})
  }

  return NextResponse.json({
    healed: true,
    token,
    health: gatewayHealth,
  })
}

export const dynamic = 'force-dynamic'
