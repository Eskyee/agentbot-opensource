import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that should be accessible without authentication
const PUBLIC_API_ROUTES = [
  '/api/stripe/webhook',
  '/api/health',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/farcaster/verify',
  '/api/auth/farcaster/refresh',
  '/api/auth/session',
  '/api/auth/signout',
  '/api/auth/google',
  '/api/auth/login',
]

// Debug routes - only allow in development
const DEBUG_ROUTES = [
  '/api/debug-',
  '/api/test-',
  '/api/deployments',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Always allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next()
  }
  
  // Allow public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow wallet auth endpoint
  if (pathname === '/api/wallet-auth') {
    return NextResponse.next()
  }
  
  // Block debug routes in production
  if (process.env.NODE_ENV === 'production') {
    if (DEBUG_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // Protected routes — check custom session cookie
  const protectedPaths = ['/dashboard', '/onboard', '/settings'];
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    const sessionToken = request.cookies.get('agentbot-session')?.value;
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Allow all other requests (auth handled by individual routes)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
