import { DEFAULT_OPENCLAW_GATEWAY_URL } from './openclaw-config'

const RAW_CONTROL_UI_BASE =
  process.env.NEXT_PUBLIC_OPENCLAW_CONTROL_UI_URL ||
  process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL ||
  DEFAULT_OPENCLAW_GATEWAY_URL

export const DEFAULT_OPENCLAW_CONTROL_UI_BASE = RAW_CONTROL_UI_BASE
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
  const base = `${DEFAULT_OPENCLAW_CONTROL_UI_BASE}/${view}`
  const href = view === 'chat'
    ? `${base}?session=${encodeURIComponent(session)}`
    : base

  const gatewayWsUrl = getGatewayWsUrl(gatewayUrl)
  if (!gatewayToken || !gatewayWsUrl) {
    return href
  }

  return `${href}#token=${encodeURIComponent(gatewayToken)}&gatewayUrl=${encodeURIComponent(gatewayWsUrl)}`
}
