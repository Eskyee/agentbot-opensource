export const DEFAULT_OPENCLAW_IMAGE = process.env.OPENCLAW_IMAGE || 'ghcr.io/openclaw/openclaw:latest'

export function deriveOpenClawVersionFromImage(image: string = DEFAULT_OPENCLAW_IMAGE): string {
  const match = image.match(/:([^:@]+)$/)
  return match?.[1] || 'unknown'
}

export const OPENCLAW_RUNTIME_VERSION = deriveOpenClawVersionFromImage()
