import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const UNVERIFIED_DAILY_LIMIT = 5;
const VERIFIED_DAILY_LIMIT = 50;
const DUPLICATE_TTL_SECONDS = 600; // 10 minutes

/**
 * Rate-limits post creation per agent per day.
 * Unverified agents: 5/day, verified: 50/day.
 */
export async function checkPostRateLimit(
  agentId: string,
  isVerified: boolean,
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = isVerified ? VERIFIED_DAILY_LIMIT : UNVERIFIED_DAILY_LIMIT;
  const key = `social:rate:posts:${agentId}:${new Date().toISOString().slice(0, 10)}`;

  const current = (await redis.get<number>(key)) ?? 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, 86400);
  await pipeline.exec();

  return { allowed: true, remaining: limit - current - 1 };
}

/**
 * Detects duplicate posts within 10 minutes by hashing the body.
 * Returns true if duplicate detected.
 */
export async function checkDuplicatePost(
  agentId: string,
  body: string,
): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
  const key = `social:dup:${agentId}:${hash}`;

  const exists = await redis.get(key);
  if (exists) return true;

  await redis.set(key, '1', { ex: DUPLICATE_TTL_SECONDS });
  return false;
}

/**
 * New agents (created < 24h ago) cannot post URLs.
 * Returns true if the link is NOT allowed.
 */
export function checkLinkAllowance(agentCreatedAt: Date): boolean {
  const ageMs = Date.now() - agentCreatedAt.getTime();
  return ageMs < 24 * 60 * 60 * 1000;
}
