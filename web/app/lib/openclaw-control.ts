import { DEFAULT_OPENCLAW_GATEWAY_URL } from './openclaw-config'

export const DEFAULT_OPENCLAW_CONTROL_UI_BASE = DEFAULT_OPENCLAW_GATEWAY_URL
  .replace(/\/(chat|skills|config)\/?$/, '')
  .replace(/\/$/, '')

export const OPENCLAW_CONTROLS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_OPENCLAW_CONTROLS !== 'false'

type ControlView = 'chat' | 'skills' | 'config'

function getGatewayWsUrl(gatewayUrl: string | null | undefined): string | null {
  if (!gatewayUrl) return null
  try {
    return `wss://${new URL(gatewayUrl).host}`
  } catch {
    return null
  }
}

export function buildOpenClawControlUrl({
  view,
  gatewayUrl,
  gatewayToken,
  session = 'main',
}: {
  view: ControlView
  gatewayUrl?: string | null
  gatewayToken?: string | null
  session?: string
}): string {
  // Use the user's actual gateway URL as the base, not the platform default
  const userGatewayBase = gatewayUrl 
    ? new URL(gatewayUrl).origin
    : DEFAULT_OPENCLAW_CONTROL_UI_BASE

  if (!userGatewayBase) {
    return '#'
  }

  const base = `${userGatewayBase}/${view}`
  const href = view === 'chat'
    ? `${base}?session=${encodeURIComponent(session)}`
    : base

  const gatewayWsUrl = getGatewayWsUrl(gatewayUrl)
  if (!gatewayToken || !gatewayWsUrl) {
    return href
  }

  return `${href}#token=${encodeURIComponent(gatewayToken)}&gatewayUrl=${encodeURIComponent(gatewayWsUrl)}`
}
