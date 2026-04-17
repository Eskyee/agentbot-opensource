const trimEnv = (value: string | undefined): string => value?.trim().replace(/\/$/, '') || ''

export const DEFAULT_OPENCLAW_GATEWAY_URL = trimEnv(
  process.env.OPENCLAW_GATEWAY_URL || process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL
)
export const DEFAULT_OPENCLAW_GATEWAY_DASHBOARD_URL = DEFAULT_OPENCLAW_GATEWAY_URL
  ? `${DEFAULT_OPENCLAW_GATEWAY_URL}/dashboard`
  : ''
export const DEFAULT_SOUL_SERVICE_URL = process.env.SOUL_SERVICE_URL || 'https://YOUR_SERVICE_URL'
export const DEFAULT_SOUL_DASHBOARD_URL = process.env.SOUL_DASHBOARD_URL || '/dashboard/borg'
