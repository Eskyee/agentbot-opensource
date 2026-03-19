export function getInternalApiKey(): string {
  const key = process.env.INTERNAL_API_KEY
  if (!key) {
    console.warn('INTERNAL_API_KEY not set, using fallback')
    return 'dev-secret-key-12345'
  }
  return key
}

export function getBackendApiUrl(): string {
  return process.env.BACKEND_API_URL || 'http://localhost:3001'
}
