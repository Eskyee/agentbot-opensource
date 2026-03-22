// Security middleware for all API routes
// Protects against: DDoS, bot attacks, brute force, injection, etc.

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'
import { verifyCSRFToken, getCSRFTokenFromHeader } from './csrf'

// Initialize Redis client (optional - falls back to memory if not available)
// WARNING: In-memory fallback resets on every serverless cold start (Vercel).
// For production, set REDIS_URL + REDIS_TOKEN for persistent rate limiting.
let redis: Redis | null = null
try {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl && !redisUrl.includes('localhost')) {
    redis = new Redis({
      url: redisUrl,
      token: process.env.REDIS_TOKEN || '',
    })
    console.log('[SECURITY] Redis rate limiting enabled')
  }
  // Note: In-memory rate limiting is fine for demos and low-traffic deployments.
  // Set REDIS_URL for persistent rate limiting in production.
} catch (error) {
  console.warn('[SECURITY] Redis not available, using in-memory rate limiting')
}

// In-memory stores for rate limiting and bot detection (fallback)
const requestLog = new Map<string, number[]>()
const failedAttempts = new Map<string, { count: number; timestamp: number }>()
const suspiciousPatterns = new Map<string, number>()

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  REQUEST_LIMIT_PER_MINUTE: 60,
  REQUEST_LIMIT_PER_HOUR: 1000,
  AUTH_ATTEMPTS_LIMIT: 5,
  AUTH_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Request validation
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_QUERY_STRING_LENGTH: 2048,
  MAX_BODY_LENGTH: 1024 * 1024, // 1MB
  
  // Bot detection patterns
  SUSPICIOUS_USER_AGENTS: [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
    'python', 'java', 'perl', 'php', 'ruby', 'go',
    'sql', 'union', 'select', 'drop', 'insert'
  ],
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Blocking
  BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
  WARN_THRESHOLD: 3,
}

// Extract client IP (handles proxies)
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

// Hash IP for consistent tracking
function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

// Check if client is rate limited (Redis-backed with memory fallback)
export async function isRateLimited(ip: string): Promise<boolean> {
  const now = Date.now()
  const hashedIP = hashIP(ip)
  
  // Use Redis if available
  if (redis) {
    try {
      const minuteKey = `ratelimit:minute:${hashedIP}`
      const hourKey = `ratelimit:hour:${hashedIP}`
      
      // Increment and get counts atomically
      const [minuteCount, hourCount] = await Promise.all([
        redis.incr(minuteKey),
        redis.incr(hourKey),
      ])
      
      // Set expiry if this is first request
      if (minuteCount === 1) {
        await redis.expire(minuteKey, 60)
      }
      if (hourCount === 1) {
        await redis.expire(hourKey, 3600)
      }
      
      // Check limits
      if (minuteCount > SECURITY_CONFIG.REQUEST_LIMIT_PER_MINUTE) {
        return true
      }
      if (hourCount > SECURITY_CONFIG.REQUEST_LIMIT_PER_HOUR) {
        return true
      }
      
      return false
    } catch (error) {
      console.warn('[SECURITY] Redis rate limit check failed, falling back to memory')
    }
  }
  
  // Fallback to in-memory rate limiting
  const requests = requestLog.get(hashedIP) || []
  
  // Remove old requests (older than 1 hour)
  const recentRequests = requests.filter(timestamp => now - timestamp < 60 * 60 * 1000)
  
  // Check minute limit
  const requestsLastMinute = recentRequests.filter(timestamp => now - timestamp < 60 * 1000)
  if (requestsLastMinute.length > SECURITY_CONFIG.REQUEST_LIMIT_PER_MINUTE) {
    return true
  }
  
  // Check hour limit
  if (recentRequests.length > SECURITY_CONFIG.REQUEST_LIMIT_PER_HOUR) {
    return true
  }
  
  // Log this request
  recentRequests.push(now)
  requestLog.set(hashedIP, recentRequests)
  
  return false
}

// Check for suspicious user agents
export function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true // No user agent = bot
  
  const lowerUA = userAgent.toLowerCase()
  return SECURITY_CONFIG.SUSPICIOUS_USER_AGENTS.some(pattern => 
    lowerUA.includes(pattern)
  )
}

// Check for SQL injection patterns
export function containsSQLInjection(value: string): boolean {
  const sqlPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi,
    /(-{2}|\/\*|\*\/|;|'.*'|".*")/g,
    /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1)/gi,
    /UNION.*SELECT/gi,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(value))
}

// Check for XSS patterns
export function containsXSSPayload(value: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(value))
}

// Validate request structure
export function validateRequest(
  method: string,
  url: string,
  headers: Record<string, string | null>
): { valid: boolean; reason?: string } {
  // Check query string length
  const urlObj = new URL(url, 'http://localhost')
  if (urlObj.search.length > SECURITY_CONFIG.MAX_QUERY_STRING_LENGTH) {
    return { valid: false, reason: 'Query string too long' }
  }
  
  // Check content-length header
  const contentLength = headers['content-length']
  if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.MAX_BODY_LENGTH) {
    return { valid: false, reason: 'Request body too large' }
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-original-url', 'x-rewrite-url', 'x-forwarded-proto']
  for (const header of suspiciousHeaders) {
    if (headers[header] && containsSQLInjection(headers[header] || '')) {
      return { valid: false, reason: 'Suspicious header detected' }
    }
  }
  
  return { valid: true }
}

// Track failed auth attempts
export function recordFailedAuth(ip: string): boolean {
  const hashedIP = hashIP(ip)
  const now = Date.now()
  
  const attempt = failedAttempts.get(hashedIP) || { count: 0, timestamp: now }
  
  // Reset if window expired
  if (now - attempt.timestamp > SECURITY_CONFIG.AUTH_ATTEMPT_WINDOW) {
    attempt.count = 0
    attempt.timestamp = now
  }
  
  attempt.count++
  failedAttempts.set(hashedIP, attempt)
  
  return attempt.count <= SECURITY_CONFIG.AUTH_ATTEMPTS_LIMIT
}

// Check if IP is blocked
export function isIPBlocked(ip: string): boolean {
  const hashedIP = hashIP(ip)
  const pattern = suspiciousPatterns.get(hashedIP)
  
  if (!pattern) return false
  
  // Block if pattern detected multiple times
  return pattern >= SECURITY_CONFIG.WARN_THRESHOLD
}

// Log suspicious activity
export function logSuspiciousActivity(
  ip: string,
  activity: string,
  details: Record<string, any> = {}
) {
  const timestamp = new Date().toISOString()
  const hashedIP = hashIP(ip)
  
  console.warn(`[SECURITY] ${timestamp} - IP: ${hashedIP}`, {
    activity,
    ...details
  })
  
  // Increment suspicious pattern count
  const current = suspiciousPatterns.get(hashedIP) || 0
  suspiciousPatterns.set(hashedIP, current + 1)
}

// Main security middleware
export async function securityMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent')
  const method = req.method
  const url = req.url
  
  // 1. Check if IP is blocked
  if (isIPBlocked(ip)) {
    logSuspiciousActivity(ip, 'BLOCKED_IP', { reason: 'Too many violations' })
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }
  
  // 2. Check rate limiting
  if (await isRateLimited(ip)) {
    logSuspiciousActivity(ip, 'RATE_LIMIT_EXCEEDED', { method, path: url })
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }
  
  // 3. Check CSRF token for state-changing methods
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    const csrfHeader = req.headers.get('x-csrf-token') || req.headers.get('x-xsrf-token')
    if (csrfHeader) {
      try {
        const [token, signed] = csrfHeader.split(':')
        if (!verifyCSRFToken(token, signed)) {
          logSuspiciousActivity(ip, 'INVALID_CSRF', { method, path: url })
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          )
        }
      } catch {
        logSuspiciousActivity(ip, 'INVALID_CSRF_FORMAT', { method, path: url })
        return NextResponse.json(
          { error: 'Invalid CSRF token format' },
          { status: 403 }
        )
      }
    }
    // CSRF header is optional for now (could be enforced by using withCSRF in secure-route)
  }
  
  // 4. Check for suspicious user agent
  if (isSuspiciousUserAgent(userAgent)) {
    logSuspiciousActivity(ip, 'SUSPICIOUS_USER_AGENT', { userAgent })
    // Allow but mark for monitoring
  }
  
  // 4. Validate request structure
  const validation = validateRequest(method, url, {
    'content-length': req.headers.get('content-length'),
    'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
    'x-original-url': req.headers.get('x-original-url'),
    'x-rewrite-url': req.headers.get('x-rewrite-url'),
  })
  
  if (!validation.valid) {
    logSuspiciousActivity(ip, 'INVALID_REQUEST', { reason: validation.reason })
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
  
  // 5. Check query parameters and headers for injection
  const searchParams = new URL(url).searchParams
  for (const [key, value] of searchParams) {
    if (containsSQLInjection(value) || containsXSSPayload(value)) {
      logSuspiciousActivity(ip, 'INJECTION_ATTEMPT', { key, value: value.substring(0, 50) })
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }
  }
  
  // 6. Call the actual handler
  try {
    const response = await handler(req)
    
    // Add security headers to response
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    
    return response
  } catch (error) {
    console.error('[SECURITY] Request handler error:', error)
    logSuspiciousActivity(ip, 'REQUEST_ERROR', { error: String(error) })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export helpers for use in route handlers
export const SecurityMiddleware = {
  recordFailedAuth,
  isRateLimited,
  isSuspiciousUserAgent,
  containsSQLInjection,
  containsXSSPayload,
  validateRequest,
  isIPBlocked,
  logSuspiciousActivity,
  getClientIP,
}
