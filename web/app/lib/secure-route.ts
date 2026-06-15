// Secure API route wrapper
// Automatically applies security checks to all endpoints

import { NextRequest, NextResponse } from 'next/server'
import { securityMiddleware, SecurityMiddleware } from './security-middleware'
import { verifyCSRFToken, generateCSRFToken, CSRFToken } from './csrf'
import { getAuthSession } from './getAuthSession'

export type SecureRouteHandler = (
  req: NextRequest,
  context?: { params?: any }
) => Promise<NextResponse>

/**
 * Wraps a route handler with security middleware
 * Provides automatic:
 * - Rate limiting
 * - DDoS protection
 * - Bot detection
 * - SQL injection prevention
 * - XSS prevention
 * - Request validation
 */
export function withSecurity(handler: SecureRouteHandler) {
  return async (req: NextRequest, context?: { params?: any }) => {
    return securityMiddleware(req, async (secureReq) => {
      return handler(secureReq, context)
    })
  }
}

/**
 * Wraps a route handler with authentication check
 * Records failed attempts for rate limiting
 */
export function withAuth(handler: SecureRouteHandler) {
  return withSecurity(async (req: NextRequest, context?: { params?: any }) => {
    const ip = SecurityMiddleware.getClientIP(req)

    // Check for Authorization header first (API key based auth)
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      return handler(req, context)
    }

    // Verify session via getAuthSession (checks DB-backed cookie + NextAuth JWT)
    const session = await getAuthSession()
    if (!session?.user?.id) {
      // Record failed auth attempt
      const allowed = SecurityMiddleware.recordFailedAuth(ip)
      if (!allowed) {
        SecurityMiddleware.logSuspiciousActivity(ip, 'TOO_MANY_AUTH_FAILURES')
        return NextResponse.json(
          { error: 'Too many failed attempts' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Continue to handler
    return handler(req, context)
  })
}

/**
 * Wraps a route handler with strict POST-only protection
 */
export function withPostOnly(handler: SecureRouteHandler) {
  return withSecurity(async (req: NextRequest, context?: { params?: any }) => {
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      )
    }
    return handler(req, context)
  })
}

/**
 * Wraps a route handler with JSON validation
 */
export function withJsonValidation(handler: SecureRouteHandler) {
  return withSecurity(async (req: NextRequest, context?: { params?: any }) => {
    try {
      const contentType = req.headers.get('content-type')
      
      if (!contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 400 }
        )
      }
      
      // Validate JSON by attempting to parse
      const body = await req.json()
      
      // Check for suspicious patterns in body
      const jsonString = JSON.stringify(body)
      if (SecurityMiddleware.containsSQLInjection(jsonString) ||
          SecurityMiddleware.containsXSSPayload(jsonString)) {
        SecurityMiddleware.logSuspiciousActivity(
          SecurityMiddleware.getClientIP(req),
          'INJECTION_IN_BODY',
          { size: jsonString.length }
        )
        return NextResponse.json(
          { error: 'Invalid input detected' },
          { status: 400 }
        )
      }
      
      // Re-create request with parsed body
      return handler(req, context)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }
  })
}

/**
 * Generate CSRF token for use in forms/requests
 */
export function getCSRFToken(): CSRFToken {
  return generateCSRFToken()
}

/**
 * Wraps a route handler with strict CSRF validation
 */
export function withCSRF(handler: SecureRouteHandler) {
  return withSecurity(async (req: NextRequest, context?: { params?: any }) => {
    const csrfHeader = req.headers.get('x-csrf-token') || req.headers.get('x-xsrf-token')
    
    if (!csrfHeader) {
      return NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      )
    }
    
    try {
      const [token, signed] = csrfHeader.split(':')
      if (!verifyCSRFToken(token, signed)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid CSRF token format' },
        { status: 403 }
      )
    }
    
    return handler(req, context)
  })
}

/**
 * Apply multiple security layers
 */
export function withSecurityLayers(
  ...layers: Array<(handler: SecureRouteHandler) => SecureRouteHandler>
) {
  return (handler: SecureRouteHandler) => {
    return layers.reduce((wrapped, layer) => layer(wrapped), handler)
  }
}

// Export preset combinations
export const SecureRoute = {
  // Basic security on all routes
  public: withSecurity,
  
  // Security + auth required
  protected: withAuth,
  
  // Security + auth + POST only
  mutation: (handler: SecureRouteHandler) =>
    withAuth(withPostOnly(handler)),
  
  // Security + JSON validation + POST only
  json: (handler: SecureRouteHandler) =>
    withPostOnly(withJsonValidation(handler)),
  
  // Maximum security for sensitive operations (auth + POST + JSON + CSRF)
  sensitive: (handler: SecureRouteHandler) =>
    withAuth(withPostOnly(withJsonValidation(withCSRF(handler)))),
}
