import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow stripe webhook
  if (pathname === '/api/stripe/webhook') {
    return NextResponse.next()
  }

  // Allow health checks
  if (pathname === '/api/health') {
    return NextResponse.next()
  }

  // Allow all other requests
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
