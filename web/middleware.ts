import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Bot detection patterns - common malicious bot User-Agent strings
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scrape/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /node-fetch/i,
  /axios/i,
  /go-http/i,
  /java/i,
  /perl/i,
  /ruby/i,
  /php/i,
  /chromeframe/i,
  /headless/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /apify/i,
  /scrapy/i,
  /screaming frog/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /rogerbot/i,
  /sistrix/i,
  /linkdex/i,
  /majestic12/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /mauibot/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /yandex/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /telegrambot/i,
  /slackbot/i,
  /discordbot/i,
  /whatsapp/i,
]

// Known malicious IP ranges (CIDR notation) - extend as needed
const BLOCKED_IP_PATTERNS: RegExp[] = []

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent))
}

function isBlockedIP(ip: string | null): boolean {
  if (!ip) return false
  // Add more sophisticated IP checking if needed
  return BLOCKED_IP_PATTERNS.some(pattern => pattern.test(ip))
}

// Simple in-memory rate limiter
// For production, consider using Vercel KV or external rate limiting service
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Structured logging helper
function log(level: string, message: string, metadata?: Record<string, unknown>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'middleware',
    message,
    ...metadata,
  }
  console.log(JSON.stringify(logEntry))
}

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

function getRateLimitInfo(key: string): { limited: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    })
    return { limited: false, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  // Increment first, then check - allows exactly RATE_LIMIT_MAX_REQUESTS
  record.count++
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    record.count-- // Don't consume the slot
    return { limited: true, remaining: 0 }
  }

  return { limited: false, remaining: RATE_LIMIT_MAX_REQUESTS - record.count }
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
  try {
    const { pathname } = request.nextUrl
    
    // Skip middleware for health checks and other internal routes
    if (pathname === '/api/health' || pathname === '/api/heartbeat') {
      return NextResponse.next()
    }
    
    const userAgent = request.headers.get('user-agent')
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || null

    // Bot detection and blocking
  if (isBotUserAgent(userAgent)) {
    // Allow legitimate search engine crawlers (Google, Bing, etc.)
    const allowedBots = [/googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /yandex/i]
    const isAllowedBot = allowedBots.some(bot => bot.test(userAgent || ''))
    
    if (!isAllowedBot) {
      log('warn', 'Bot blocked', { userAgent, clientIP, pathname })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Access Denied',
          message: 'Automated requests not allowed'
        }), 
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Bot-Blocked': 'true',
          },
        }
      )
    }
  }

  // Block known malicious IPs
  if (isBlockedIP(clientIP)) {
    log('warn', 'IP blocked', { clientIP, pathname })
    return new NextResponse(
      JSON.stringify({ 
        error: 'Access Denied',
        message: 'Your IP has been blocked'
      }), 
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  // Skip rate limiting for excluded paths
  if (shouldExclude(pathname)) {
    return NextResponse.next()
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request)

    const rateLimitInfo = getRateLimitInfo(key)

    if (rateLimitInfo.limited) {
      log('warn', 'Rate limit exceeded', { key, pathname })
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
    response.headers.set('X-RateLimit-Remaining', String(rateLimitInfo.remaining))
    log('info', 'Request processed', { key, pathname, method: request.method })
    return response
  }

  return NextResponse.next()
  } catch (error) {
    log('error', 'Middleware error', {  
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    })
    return NextResponse.next()
  }
}

export const config = {
  runtime: 'edge',
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
