export const DEFAULT_OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:2026.4.21'

export function deriveOpenClawVersionFromImage(image: string = DEFAULT_OPENCLAW_IMAGE): string {
  const match = image.match(/:([^:@]+)$/)
  const version = match?.[1] || 'unknown'
  return version === 'latest' ? '2026.4.21' : version
}

export const OPENCLAW_RUNTIME_VERSION = deriveOpenClawVersionFromImage()
