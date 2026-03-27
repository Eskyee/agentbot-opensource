/**
 * Nonce Replay Protection
 * In-memory nonce cache with 5-minute TTL.
 * Prevents duplicate API calls from being replayed.
 */

const usedNonces = new Map<string, number>();
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Auto-cleanup every 60 seconds
setInterval(() => {
  const cutoff = Date.now() - NONCE_TTL_MS;
  for (const [key, ts] of usedNonces) {
    if (ts < cutoff) usedNonces.delete(key);
  }
}, 60 * 1000);

/**
 * Check if a nonce has already been used
 */
export function isNonceUsed(agentPublicKey: string, nonce: string): boolean {
  const key = `${agentPublicKey}:${nonce}`;
  const ts = usedNonces.get(key);
  if (!ts) return false;
  if (Date.now() - ts > NONCE_TTL_MS) {
    usedNonces.delete(key);
    return false;
  }
  return true;
}

/**
 * Mark a nonce as used
 */
export function markNonceUsed(agentPublicKey: string, nonce: string): void {
  const key = `${agentPublicKey}:${nonce}`;
  usedNonces.set(key, Date.now());
}

/**
 * Validate nonce format (8-64 chars)
 */
export function isValidNonceFormat(nonce: string): boolean {
  return typeof nonce === 'string' && nonce.length >= 8 && nonce.length <= 64;
}
