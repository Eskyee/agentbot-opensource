/**
 * Playground usage — daily generation counter + gating.
 *
 * Free tier: 3 generations/day (per user or per IP for anonymous).
 * Paid tier: unlimited (subscription active).
 *
 * Uses Redis when available, falls back to in-memory Map.
 */
import { redis } from '@/app/lib/redis'

export const FREE_DAILY_LIMIT = 3
const REDIS_PREFIX = 'playground:gens:'

/** In-memory fallback when Redis is unavailable. */
const memStore = new Map<string, { count: number; resetsAt: number }>()

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayResetMs() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setHours(24, 0, 0, 0)
  return tomorrow.getTime()
}

/** Get today's generation count for a user/IP. */
export async function getDailyGenerationCount(identifier: string): Promise<number> {
  const key = `${REDIS_PREFIX}${identifier}:${todayKey()}`

  if (redis) {
    try {
      const val = await redis.get(key)
      return val ? parseInt(String(val), 10) || 0 : 0
    } catch {
      // fall through to memory
    }
  }

  const entry = memStore.get(key)
  if (!entry || Date.now() > entry.resetsAt) return 0
  return entry.count
}

/** Increment today's generation count. Returns the new count. */
export async function incrementDailyGenerationCount(identifier: string): Promise<number> {
  const key = `${REDIS_PREFIX}${identifier}:${todayKey()}`

  if (redis) {
    try {
      const count = await redis.incr(key)
      // Expire at end of day (25 hours to be safe)
      if (count === 1) {
        await redis.expire(key, 25 * 60 * 60)
      }
      return Number(count)
    } catch {
      // fall through to memory
    }
  }

  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now > entry.resetsAt) {
    memStore.set(key, { count: 1, resetsAt: todayResetMs() })
    return 1
  }
  entry.count += 1
  return entry.count
}

/** Check if user has hit the free tier limit. Returns { allowed, remaining, limit }. */
export async function checkPlaygroundAllowance(
  identifier: string,
  isPaidUser: boolean,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  if (isPaidUser) {
    return { allowed: true, remaining: Infinity, limit: Infinity }
  }

  const count = await getDailyGenerationCount(identifier)
  const remaining = Math.max(0, FREE_DAILY_LIMIT - count)

  return {
    allowed: count < FREE_DAILY_LIMIT,
    remaining,
    limit: FREE_DAILY_LIMIT,
  }
}
