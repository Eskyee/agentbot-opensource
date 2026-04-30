export const MANAGED_OPENCLAW_VERSION = '2026.4.27'
export const DEFAULT_OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || `ghcr.io/openclaw/openclaw:${MANAGED_OPENCLAW_VERSION}`

export function deriveOpenClawVersionFromImage(image: string = DEFAULT_OPENCLAW_IMAGE): string {
  const match = image.match(/:([^:@]+)$/)
  const version = match?.[1] || 'unknown'
  return version === 'latest' ? MANAGED_OPENCLAW_VERSION : version
}

export const OPENCLAW_RUNTIME_VERSION = deriveOpenClawVersionFromImage()
