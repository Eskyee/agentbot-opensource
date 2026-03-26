/**
 * Session-Aware Fetch — Auto-attach payment session headers
 * 
 * Wraps fetch calls to automatically include session billing headers
 * when a user has an active payment session.
 * 
 * Usage:
 *   import { sessionFetch } from '@/lib/mpp/session-fetch'
 *   const res = await sessionFetch('/api/v1/gateway', { method: 'POST', body: ... })
 */

'use client'

const WALLET_ADDRESS_KEY = 'tempo_wallet_address'
const SESSION_ID_KEY = 'tempo_session_id'

/**
 * Get stored wallet address
 */
export function getWalletAddress(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(WALLET_ADDRESS_KEY)
}

/**
 * Get stored session ID
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_ID_KEY)
}

/**
 * Store session ID
 */
export function setSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_ID_KEY, sessionId)
}

/**
 * Clear session ID
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_ID_KEY)
}

/**
 * Session-aware fetch
 * 
 * Automatically includes X-Session-Id and X-Wallet-Address headers
 * when the user has an active payment session.
 */
export async function sessionFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {})
  
  // Auto-attach session headers if available
  const walletAddress = getWalletAddress()
  const sessionId = getSessionId()
  
  if (walletAddress && sessionId) {
    headers.set('X-Wallet-Address', walletAddress)
    headers.set('X-Session-Id', sessionId)
    headers.set('X-Payment-Method', 'session')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Check if user has an active payment session
 */
export function hasActiveSession(): boolean {
  return !!(getWalletAddress() && getSessionId())
}
