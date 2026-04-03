export const DEFAULT_OPENCLAW_GATEWAY_URL = 'https://openclaw-gw-ui-production.up.railway.app'
export const DEFAULT_OPENCLAW_GATEWAY_DASHBOARD_URL = `${DEFAULT_OPENCLAW_GATEWAY_URL}/dashboard`
export const DEFAULT_SOUL_SERVICE_URL = process.env.SOUL_SERVICE_URL || 'https://borg-0-production.up.railway.app'
export const DEFAULT_SOUL_DASHBOARD_URL = `${DEFAULT_SOUL_SERVICE_URL.replace(/\/$/, '')}/dashboard`
