const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('INTERNAL_API_KEY is required in production') })() : 'dev-secret-key-12345')

export function getInternalApiKey(): string {
  if (process.env.NODE_ENV === 'production' && !process.env.INTERNAL_API_KEY) {
    throw new Error('INTERNAL_API_KEY environment variable is not set')
  }
  return INTERNAL_API_KEY
}

export function getBackendApiUrl(): string {
  return process.env.BACKEND_API_URL || 'http://localhost:3001'
}
