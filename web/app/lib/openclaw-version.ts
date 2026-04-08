export const DEFAULT_OPENCLAW_IMAGE =
  process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:2026.4.7'

export const DEFAULT_OPENCLAW_VERSION =
  DEFAULT_OPENCLAW_IMAGE.split(':').pop() || 'unknown'
