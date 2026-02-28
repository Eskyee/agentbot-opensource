import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// For production, consider using Vercel KV or external rate limiting service
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // max requests per window

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or forwarded header for identification
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown'
  return ip
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    })
    return false
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  record.count++
  return false
}

// Paths that should not be rate limited
const EXCLUDED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/og-image.png',
  '/manifest.json',
  '/apple-touch-icon.png',
]

function shouldExclude(path: string): boolean {
  return EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip rate limiting for excluded paths
  if (shouldExclude(pathname)) {
    return NextResponse.next()
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request)

    if (isRateLimited(key)) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests',
          message: 'Please try again later'
        }), 
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + RATE_LIMIT_WINDOW_MS) / 1000)),
          },
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS))
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
