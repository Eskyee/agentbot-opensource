import { Redis } from '@upstash/redis'

/**
 * Centralized Redis client for rate limiting and state persistence.
 * Uses Upstash REST API for serverless compatibility.
 */

let redis: Redis | null = null

try {
  // Prefer KV_REST_API_URL if set (Vercel standard)
  const url = (process.env.KV_REST_API_URL || process.env.REDIS_URL)?.trim()
  const token = (process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN)?.trim()

  if (url && token && !url.includes('localhost')) {
    // Convert rediss:// to https:// if needed (Upstash REST client requirement)
    const restUrl = url.replace('rediss://', 'https://').replace('redis://', 'http://')
    
    redis = new Redis({
      url: restUrl,
      token: token,
      // Increase timeout for cold starts and heavy loads
      // @ts-ignore
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.exp(retryCount) * 50,
      },
    })
  }
} catch (error) {
  console.warn('[REDIS] Initialization failed:', error)
}

export { redis }
export default redis
