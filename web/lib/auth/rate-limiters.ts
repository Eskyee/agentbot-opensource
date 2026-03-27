/**
 * Per-endpoint Rate Limiting
 * In-memory sliding window rate limiters for different endpoint categories.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const windows = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const LIMITERS: Record<string, RateLimitConfig> = {
  verification: { windowMs: 60 * 1000, maxRequests: 10 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  feedback: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  gateway: { windowMs: 60 * 1000, maxRequests: 30 },
};

function getRateLimitKey(limiter: string, identifier: string): string {
  return `${limiter}:${identifier}`;
}

/**
 * Check if a request should be rate limited
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  limiterName: keyof typeof LIMITERS,
  identifier: string
): { allowed: boolean; remaining: number; resetMs: number } {
  const config = LIMITERS[limiterName];
  if (!config) return { allowed: true, remaining: 999, resetMs: 0 };

  const key = getRateLimitKey(limiterName, identifier);
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let entry = windows.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    windows.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  const remaining = config.maxRequests - entry.timestamps.length;
  const resetMs = entry.timestamps.length > 0
    ? entry.timestamps[0] + config.windowMs - now
    : 0;

  if (entry.timestamps.length >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: remaining - 1, resetMs: 0 };
}

/**
 * Express/Next.js middleware wrapper for rate limiting
 */
export function rateLimitMiddleware(limiterName: keyof typeof LIMITERS) {
  return (identifier: string) => checkRateLimit(limiterName, identifier);
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows) {
    const limiterName = key.split(':')[0];
    const config = LIMITERS[limiterName];
    if (!config) {
      windows.delete(key);
      continue;
    }
    const cutoff = now - config.windowMs;
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) windows.delete(key);
  }
}, 5 * 60 * 1000);
