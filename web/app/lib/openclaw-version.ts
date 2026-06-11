export const MANAGED_OPENCLAW_VERSION = '2026.6.5'

export const DEFAULT_OPENCLAW_IMAGE =
  process.env.OPENCLAW_IMAGE || `ghcr.io/openclaw/openclaw:${MANAGED_OPENCLAW_VERSION}`

export const DEFAULT_OPENCLAW_VERSION =
  DEFAULT_OPENCLAW_IMAGE.split(':').pop() === 'latest'
    ? MANAGED_OPENCLAW_VERSION
    : DEFAULT_OPENCLAW_IMAGE.split(':').pop() || 'unknown'
