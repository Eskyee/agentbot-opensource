/**
 * POST /api/support/heal-token
 * 
 * Auto-heals (regenerates) gateway tokens for OpenClaw users.
 * Now automatically generates new tokens when missing instead of just checking.
 */

import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { 
  getOrCreateUserGatewayToken, 
  refreshUserGatewayToken,
  getTokenDebugInfo 
} from '@/app/lib/token-manager'
import { checkServices } from '@/app/lib/service-health'
import { sendSupportAlert } from '@/app/lib/support-alert'
import { DEFAULT_OPENCLAW_GATEWAY_URL } from '@/app/lib/openclaw-config'

export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const userEmail = session.user.email

  try {
    // Check gateway health first
    const gatewayUrl = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || DEFAULT_OPENCLAW_GATEWAY_URL
    const health = await checkServices([{ 
      name: 'OpenClaw Gateway', 
      url: `${gatewayUrl}/api/status` 
    }])
    const gatewayHealth = health[0]
    const status = gatewayHealth?.status || 'down'

    // Try to get or create a user-specific token
    let tokenResult = await getOrCreateUserGatewayToken(userId)
    
    // If no token could be retrieved/created, try refreshing
    if (!tokenResult) {
      console.log(`[HealToken] No existing token found, generating new one for user: ${userId}`)
      tokenResult = await refreshUserGatewayToken(userId)
    }

    if (!tokenResult) {
      const message = 'Failed to generate gateway token. Support has been alerted.'
      sendSupportAlert({ 
        title: 'Auto Pair healing failed - Token Generation Error', 
        message, 
        metadata: { user: userEmail, userId, status } 
      }).catch(() => {})
      
      return NextResponse.json({
        healed: false,
        message,
        health: gatewayHealth,
      }, { status: 500 })
    }

    // Log token debug info
    const debugInfo = getTokenDebugInfo(tokenResult.token)
    console.log(`[HealToken] Token healed for user ${userId}:`, debugInfo)

    // Alert if gateway is degraded
    if (status !== 'ok') {
      sendSupportAlert({
        title: 'Gateway health degraded during healing',
        message: `Auto Pair health check returned ${status}`,
        metadata: { user: userEmail, userId, detail: gatewayHealth.detail },
      }).catch(() => {})
    }

    return NextResponse.json({
      healed: true,
      token: tokenResult.token,
      isNew: tokenResult.isNew,
      health: gatewayHealth,
      message: tokenResult.isNew 
        ? 'New gateway token generated successfully' 
        : 'Existing gateway token validated',
    })

  } catch (error) {
    console.error('[HealToken] Unexpected error:', error)
    
    sendSupportAlert({
      title: 'Auto Pair healing failed - Exception',
      message: error instanceof Error ? error.message : 'Unknown error',
      metadata: { user: userEmail, userId },
    }).catch(() => {})

    return NextResponse.json({
      healed: false,
      message: 'Internal error during token healing',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
