import { Redis } from '@upstash/redis';

function getRedis(): Redis | null {
  const url = (process.env.KV_REST_API_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || '').trim();
  if (!url.startsWith('https://') || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

export async function checkUserRateLimit(
  scope: string,
  userId: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: limit, retryAfter: 0 };

  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${scope}:${userId}:${bucket}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, windowSeconds);
    const results = await pipeline.exec<[number, number]>();
    const newCount = Number(results?.[0] ?? 0);
    if (newCount > limit) {
      const retryAfter = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
      return { allowed: false, remaining: 0, retryAfter };
    }
    return { allowed: true, remaining: Math.max(0, limit - newCount), retryAfter: 0 };
  } catch (err) {
    console.error('[rate-limit-user] Redis error (fail-open):', err);
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}
