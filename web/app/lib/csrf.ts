// CSRF Protection utilities
// Provides token-based CSRF protection for state-changing operations

import { createHash, randomBytes } from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production'
const TOKEN_LENGTH = 32

export interface CSRFToken {
  token: string
  signed: string
}

function signToken(token: string): string {
  return createHash('sha256')
    .update(token + CSRF_SECRET)
    .digest('hex')
}

function verifySignature(token: string, signature: string): boolean {
  return signToken(token) === signature
}

export function generateCSRFToken(): CSRFToken {
  const token = randomBytes(TOKEN_LENGTH).toString('hex')
  const signed = signToken(token)
  return { token, signed }
}

export function verifyCSRFToken(token: string, signed: string): boolean {
  if (!token || !signed) return false
  return verifySignature(token, signed)
}

export function getCSRFTokenFromHeader(req: Request): { token: string; signed: string } | null {
  const header = req.headers.get('x-csrf-token') || req.headers.get('x-xsrf-token')
  if (!header) return null
  
  try {
    const parts = header.split(':')
    if (parts.length !== 2) return null
    return { token: parts[0], signed: parts[1] }
  } catch {
    return null
  }
}

export function validateCSRF(req: Request): boolean {
  const csrf = getCSRFTokenFromHeader(req)
  if (!csrf) return false
  return verifyCSRFToken(csrf.token, csrf.signed)
}

export function csrfMiddleware(req: Request): { valid: boolean; error?: string } {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return { valid: true }
  }
  
  if (!validateCSRF(req)) {
    return { valid: false, error: 'Invalid CSRF token' }
  }
  
  return { valid: true }
}
