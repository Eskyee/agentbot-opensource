import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { invokeGatewayTool, gatewayHealthcheck } from '@/app/lib/gateway-proxy'

/**
 * GET /api/channels
 * Real channel status from the OpenClaw gateway.
 */
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Get gateway health first
  const health = await gatewayHealthcheck()

  // Try to get channel status via tools
  const [sessionsResult, statusResult] = await Promise.all([
    invokeGatewayTool('sessions_list', { action: 'json', limit: 50 }, userId),
    invokeGatewayTool('session_status', {}, userId),
  ])

  // Parse sessions to infer which channels are active
  let sessionList: any[] = []
  if (sessionsResult.ok && sessionsResult.result) {
    const data = typeof sessionsResult.result === 'string'
      ? JSON.parse(sessionsResult.result)
      : sessionsResult.result
    sessionList = Array.isArray(data) ? data : data?.sessions || data?.result || []
  }

  // Detect active channels from session keys
  const channelActivity: Record<string, { lastActive: string; messageCount: number }> = {}
  for (const s of sessionList) {
    const key = s.sessionKey || s.key || ''
    let channel = 'webchat'
    if (key.includes('telegram')) channel = 'telegram'
    else if (key.includes('discord')) channel = 'discord'
    else if (key.includes('whatsapp')) channel = 'whatsapp'
    else if (key.includes('imessage')) channel = 'imessage'

    if (!channelActivity[channel]) {
      channelActivity[channel] = { lastActive: s.lastActivity || '', messageCount: 0 }
    }
    channelActivity[channel].messageCount += s.messageCount || s.turns || 0
  }

  // Build channel list with real status
  const channels = [
    {
      name: 'Webchat',
      provider: 'webchat',
      status: health.ok ? 'connected' : 'unreachable',
      lastActive: channelActivity.webchat?.lastActive || null,
      messages: channelActivity.webchat?.messageCount || 0,
    },
    {
      name: 'Telegram',
      provider: 'telegram',
      status: channelActivity.telegram ? 'connected' : 'not-configured',
      lastActive: channelActivity.telegram?.lastActive || null,
      messages: channelActivity.telegram?.messageCount || 0,
    },
    {
      name: 'Discord',
      provider: 'discord',
      status: channelActivity.discord ? 'connected' : 'not-configured',
      lastActive: channelActivity.discord?.lastActive || null,
      messages: channelActivity.discord?.messageCount || 0,
    },
    {
      name: 'WhatsApp',
      provider: 'whatsapp',
      status: channelActivity.whatsapp ? 'connected' : 'not-configured',
      lastActive: channelActivity.whatsapp?.lastActive || null,
      messages: channelActivity.whatsapp?.messageCount || 0,
    },
    {
      name: 'iMessage',
      provider: 'imessage',
      status: channelActivity.imessage ? 'connected' : 'not-configured',
      lastActive: channelActivity.imessage?.lastActive || null,
      messages: channelActivity.imessage?.messageCount || 0,
    },
  ]

  return NextResponse.json({
    channels,
    gatewayHealth: health.ok ? 'healthy' : 'unreachable',
    source: 'gateway',
  })
}

export const dynamic = 'force-dynamic'
