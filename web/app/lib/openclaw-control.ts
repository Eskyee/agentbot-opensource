import { DEFAULT_OPENCLAW_GATEWAY_URL } from './openclaw-config'

export const DEFAULT_OPENCLAW_CONTROL_UI_BASE = DEFAULT_OPENCLAW_GATEWAY_URL
  .replace(/\/(chat|skills|config)\/?$/, '')
  .replace(/\/$/, '')

export const OPENCLAW_CONTROLS_ENABLED = true

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
  // Keep the UI on the shared control origin. Sending users to their raw
  // Railway runtime origin strands them on a different auth domain, and
  // runtime-local routes like /dreaming can break session/login flows.
  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const controlUiBase = DEFAULT_OPENCLAW_CONTROL_UI_BASE || (() => {
    if (browserOrigin) return browserOrigin
    try {
      return gatewayUrl ? new URL(gatewayUrl).origin : ''
    } catch {
      return ''
    }
  })()

  if (!controlUiBase) {
    return '#'
  }

  const base = `${controlUiBase}/${view}`
  const href = view === 'chat'
    ? `${base}?session=${encodeURIComponent(session)}`
    : base

  const gatewayWsUrl = getGatewayWsUrl(gatewayUrl)
  if (!gatewayToken || !gatewayWsUrl) {
    return href
  }

  return `${href}#token=${encodeURIComponent(gatewayToken)}&gatewayUrl=${encodeURIComponent(gatewayWsUrl)}`
}
