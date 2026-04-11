export const DEFAULT_OPENCLAW_IMAGE =
  process.env.OPENCLAW_IMAGE || 'ghcr.io/eskyee/agentbot-openclaw:latest'

export const DEFAULT_OPENCLAW_VERSION =
  DEFAULT_OPENCLAW_IMAGE.split(':').pop() || 'unknown'
