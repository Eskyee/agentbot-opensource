import { logTokenSanitization } from './token-logger'

export function readSharedGatewayToken(): string | null {
  const raw = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || ''
  const trimmed = raw.trim()
  logTokenSanitization('shared-token', raw, trimmed)
  return trimmed || null
}
