import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow stripe webhook without any checks
  if (pathname === '/api/stripe/webhook') {
    return NextResponse.next()
  }

  try {
    const userAgent = request.headers.get('user-agent')
    if (userAgent && /curl|wget|bot/i.test(userAgent)) {
      return new NextResponse(JSON.stringify({ error: 'Access Denied' }), { status: 403 })
    }
    return NextResponse.next()
  } catch (error) {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
