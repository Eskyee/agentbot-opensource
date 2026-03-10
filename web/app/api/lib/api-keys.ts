export function getInternalApiKey(): string {
  const key = process.env.INTERNAL_API_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('INTERNAL_API_KEY environment variable is required in production')
    }
    console.warn('INTERNAL_API_KEY not set, using fallback (not secure for production)')
    return 'dev-secret-key-12345'
  }
  return key
}

export function getBackendApiUrl(): string {
  return process.env.BACKEND_API_URL || 'http://localhost:3001'
}
