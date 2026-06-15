/**
 * Tiered, category-based rate limiting for API routes.
 *
 * The legacy `isRateLimited` in security-middleware applies one global
 * 60/min · 1000/hr budget per IP. This adds *per-category, per-bucket* limits
 * so AI-cost and auth routes can be tighter than reads — all from one place.
 *
 * Usage — wrap a handler:
 *   export const POST = withRateLimit('ai', async (req) => { ... })
 *
 * Or check inline (when you need the IP/handler for other reasons):
 *   const limited = await checkRateLimit(req, 'auth')
 *   if (limited) return tooManyRequests()
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { redis } from '@/app/lib/redis'
import { getClientIP } from '@/app/lib/security-middleware'
import { tooManyRequests } from './respond'

export type RateCategory = 'ai' | 'auth' | 'write' | 'read' | 'webhook'

/** requests allowed per window, per IP, per category */
const LIMITS: Record<RateCategory, { perMinute: number; perHour: number }> = {
  ai: { perMinute: 10, perHour: 120 }, // spend-per-request — tight
  auth: { perMinute: 8, perHour: 60 }, // brute-force surface — tight
  write: { perMinute: 40, perHour: 800 },
  read: { perMinute: 120, perHour: 4000 }, // cheap GETs — loose
  webhook: { perMinute: 300, perHour: 10000 }, // bursty inbound — very loose
}

function bucketHash(category: RateCategory, ip: string): string {
  return createHash('sha256').update(`${category}:${ip}`).digest('hex').slice(0, 16)
}

// In-memory fallback when Redis isn't configured (dev / preview)
const memory = new Map<string, number[]>()

/**
 * Returns true if the request should be blocked. Fails open on Redis errors
 * (availability over strictness) but still enforces via memory fallback.
 */
export async function checkRateLimit(req: NextRequest, category: RateCategory = 'read'): Promise<boolean> {
  const limit = LIMITS[category]
  const key = bucketHash(category, getClientIP(req))
  const now = Date.now()

  if (redis) {
    try {
      const minuteKey = `rl:${category}:m:${key}`
      const hourKey = `rl:${category}:h:${key}`
      const [minuteCount, hourCount] = await Promise.all([redis.incr(minuteKey), redis.incr(hourKey)])
      if (minuteCount === 1) await redis.expire(minuteKey, 60)
      if (hourCount === 1) await redis.expire(hourKey, 3600)
      return minuteCount > limit.perMinute || hourCount > limit.perHour
    } catch {
      console.warn('[rate-limit] redis check failed, using memory fallback')
    }
  }

  const hits = (memory.get(key) ?? []).filter((t) => now - t < 3_600_000)
  const lastMinute = hits.filter((t) => now - t < 60_000).length
  if (lastMinute >= limit.perMinute || hits.length >= limit.perHour) return true
  hits.push(now)
  memory.set(key, hits)
  return false
}

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse> | NextResponse

/**
 * Wrap a route handler so requests over the category budget get a 429 before
 * the handler runs.
 */
export function withRateLimit(category: RateCategory, handler: Handler): Handler {
  return async (req, ctx) => {
    if (await checkRateLimit(req, category)) return tooManyRequests()
    return handler(req, ctx)
  }
}
