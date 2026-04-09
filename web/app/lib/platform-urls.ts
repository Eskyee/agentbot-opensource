function trimUrl(value: string | undefined, fallback: string): string {
  // Strip real newlines AND literal \n \r artifacts from Vercel CLI env exports
  const cleaned = value?.replace(/\\n|\\r|\n|\r/g, '').trim()
  return (cleaned || fallback).replace(/\/$/, '')
}

export const AGENTBOT_BACKEND_URL = trimUrl(
  process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.BACKEND_API_URL,
  'https://agentbot-backend-production.up.railway.app'
)

export const X402_GATEWAY_URL = trimUrl(
  process.env.NEXT_PUBLIC_X402_GATEWAY_URL || process.env.X402_GATEWAY_URL,
  'https://x402-gateway-production.up.railway.app'
)

export const SOUL_SERVICE_URL = trimUrl(
  process.env.NEXT_PUBLIC_SOUL_SERVICE_URL || process.env.SOUL_SERVICE_URL,
  'https://borg-0-production.up.railway.app'
)

export const SOUL_DASHBOARD_URL = '/dashboard/borg'
