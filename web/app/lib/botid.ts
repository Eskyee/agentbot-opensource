import { checkBotId } from 'botid/server';

/**
 * Check BotID on every AI request to prevent inference theft.
 * See: https://vercel.com/blog/protecting-against-token-theft
 *
 * Usage in route handlers:
 *   const verification = await verifyBotRequest();
 *   if (verification.blocked) {
 *     return NextResponse.json({ error: verification.reason }, { status: 403 });
 *   }
 */
export async function verifyBotRequest(): Promise<{
  blocked: boolean;
  reason?: string;
  classification?: string;
}> {
  // Skip check if BotID is not configured
  if (!process.env.BOTID_PROJECT_KEY) {
    return { blocked: false };
  }

  try {
    const verification = await checkBotId();

    if (verification.isBot) {
      console.warn('[botid] Blocked bot request:', verification.classification);
      return {
        blocked: true,
        reason: 'Access denied',
        classification: verification.classification,
      };
    }

    return { blocked: false, classification: verification.classification };
  } catch (error) {
    // If BotID fails, log but don't block (fail open for availability)
    console.error('[botid] Check failed:', error);
    return { blocked: false };
  }
}

/**
 * Rate limiting per IP for AI endpoints.
 * Simple in-memory rate limiter as a secondary defense.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

/**
 * Combined protection: BotID + rate limiting.
 * Run this at the top of every AI route handler.
 */
export async function protectAiEndpoint(ip: string): Promise<{
  blocked: boolean;
  reason?: string;
  status?: number;
}> {
  // 1. BotID check (primary defense)
  const botCheck = await verifyBotRequest();
  if (botCheck.blocked) {
    return { blocked: true, reason: botCheck.reason, status: 403 };
  }

  // 2. Rate limit check (secondary defense)
  const rateCheck = checkRateLimit(ip, 30, 60000);
  if (!rateCheck.allowed) {
    return {
      blocked: true,
      reason: 'Rate limit exceeded. Try again later.',
      status: 429,
    };
  }

  return { blocked: false };
}
