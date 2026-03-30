/**
 * Backend API helpers.
 * INTERNAL_API_KEY and BACKEND_API_URL must be set in the deployment
 * environment. The fallbacks here are for local development only and
 * will cause a startup error in production (enforced by agentbot-backend/src/index.ts).
 */

export function getInternalApiKey(): string {
  const key = process.env.INTERNAL_API_KEY
  if (!key) {
    throw new Error('INTERNAL_API_KEY is not set. Cannot authenticate with backend.')
  }
  return key
}

export function getBackendApiUrl(): string {
  const url = process.env.BACKEND_API_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BACKEND_API_URL is not set. Cannot reach backend API.')
    }
    return 'http://localhost:3001'
  }
  return url
}
