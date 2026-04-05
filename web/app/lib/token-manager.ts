/**
 * token-manager.ts — Automatic Token Generation & Management
 *
 * Handles auto-refresh of gateway tokens for OpenClaw users.
 * Generates cryptographically secure tokens and stores them per-user.
 */

import { prisma } from './prisma'
import * as crypto from 'crypto'

export interface TokenResult {
  token: string
  isNew: boolean
  expiresAt?: Date
}

/**
 * Generate a cryptographically secure gateway token
 */
export function generateGatewayToken(): string {
  // Generate 32 bytes of entropy (64 hex characters)
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get or create a gateway token for a user
 * Auto-refreshes if token is missing
 */
export async function getOrCreateUserGatewayToken(
  userId: string
): Promise<TokenResult | null> {
  try {
    // Check if user already has a valid token in agent_registrations
    const registration = await prisma.$queryRaw<{ gateway_token: string | null }[]> `
      SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId}
    `

    if (registration[0]?.gateway_token) {
      return {
        token: registration[0].gateway_token,
        isNew: false
      }
    }

    // No token exists - generate a new one
    const newToken = generateGatewayToken()

    // Store in agent_registrations (upsert)
    await prisma.$executeRaw`
      INSERT INTO agent_registrations (user_id, mode, gateway_token, registered_at, last_seen, status)
      VALUES (${userId}, 'home', ${newToken}, NOW(), NOW(), 'active')
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        gateway_token = ${newToken},
        last_seen = NOW()
    `

    console.log(`[TokenManager] Generated new gateway token for user: ${userId}`)

    return {
      token: newToken,
      isNew: true
    }
  } catch (error) {
    console.error('[TokenManager] Failed to get/create token:', error)
    return null
  }
}

/**
 * Refresh (regenerate) a user's gateway token
 * Use when token is compromised or expired
 */
export async function refreshUserGatewayToken(
  userId: string
): Promise<TokenResult | null> {
  try {
    const newToken = generateGatewayToken()

    await prisma.$executeRaw`
      INSERT INTO agent_registrations (user_id, mode, gateway_token, registered_at, last_seen, status)
      VALUES (${userId}, 'home', ${newToken}, NOW(), NOW(), 'active')
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        gateway_token = ${newToken},
        last_seen = NOW()
    `

    console.log(`[TokenManager] Refreshed gateway token for user: ${userId}`)

    return {
      token: newToken,
      isNew: true
    }
  } catch (error) {
    console.error('[TokenManager] Failed to refresh token:', error)
    return null
  }
}

/**
 * Get the shared platform token (for backward compatibility)
 */
export function getSharedGatewayToken(): string | null {
  const raw = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || ''
  return raw.trim() || null
}

/**
 * Get token for a user - tries user-specific first, falls back to shared
 */
export async function getEffectiveGatewayToken(
  userId: string
): Promise<string | null> {
  // First try to get user-specific token
  const userToken = await getOrCreateUserGatewayToken(userId)
  if (userToken) {
    return userToken.token
  }

  // Fall back to shared token
  return getSharedGatewayToken()
}

/**
 * Validate if a token is properly formatted
 */
export function isValidTokenFormat(token: string): boolean {
  // Should be a 64-character hex string
  return /^[a-f0-9]{64}$/i.test(token)
}

/**
 * Get token info for debugging (safely)
 */
export function getTokenDebugInfo(token: string | null): {
  exists: boolean
  length: number
  format: 'valid' | 'invalid' | 'unknown'
  preview: string
} {
  if (!token) {
    return {
      exists: false,
      length: 0,
      format: 'unknown',
      preview: 'null'
    }
  }

  return {
    exists: true,
    length: token.length,
    format: isValidTokenFormat(token) ? 'valid' : 'invalid',
    preview: `${token.slice(0, 8)}...${token.slice(-8)}`
  }
}
