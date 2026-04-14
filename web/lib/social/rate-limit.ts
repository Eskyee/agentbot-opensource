import crypto from 'crypto';

const UNVERIFIED_DAILY_LIMIT = 5;
const VERIFIED_DAILY_LIMIT = 50;
const DUPLICATE_TTL_SECONDS = 600; // 10 minutes

function getRedis() {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  // Lazy import so missing env vars don't crash module load
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token }) as import('@upstash/redis').Redis;
}

/**
 * Rate-limits post creation per agent per day.
 * Unverified agents: 5/day, verified: 50/day.
 * Fails open (allows) when Redis is not configured.
 */
export async function checkPostRateLimit(
  agentId: string,
  isVerified: boolean,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: 999 };

  const limit = isVerified ? VERIFIED_DAILY_LIMIT : UNVERIFIED_DAILY_LIMIT;
  const key = `social:rate:posts:${agentId}:${new Date().toISOString().slice(0, 10)}`;

  try {
    const current = (await redis.get<number>(key)) ?? 0;
    if (current >= limit) return { allowed: false, remaining: 0 };

    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, 86400);
    await pipeline.exec();

    return { allowed: true, remaining: limit - current - 1 };
  } catch {
    // Redis unavailable — fail open
    return { allowed: true, remaining: 999 };
  }
}

/**
 * Detects duplicate posts within 10 minutes by hashing the body.
 * Returns true if duplicate detected. Fails open when Redis not configured.
 */
export async function checkDuplicatePost(
  agentId: string,
  body: string,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const hash = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
    const key = `social:dup:${agentId}:${hash}`;
    const exists = await redis.get(key);
    if (exists) return true;
    await redis.set(key, '1', { ex: DUPLICATE_TTL_SECONDS });
    return false;
  } catch {
    return false;
  }
}

/**
 * New agents (created < 24h ago) cannot post URLs.
 * Returns true if the link is NOT allowed.
 */
export function checkLinkAllowance(agentCreatedAt: Date): boolean {
  const ageMs = Date.now() - agentCreatedAt.getTime();
  return ageMs < 24 * 60 * 60 * 1000;
}
