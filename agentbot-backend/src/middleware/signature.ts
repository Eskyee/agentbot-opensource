import { Request, Response, NextFunction } from 'express';
import { verifyMessage } from '@ethersproject/wallet';
import { getAddress } from '@ethersproject/address';
import { canonicalJsonStringify } from '../utils/canonical-json';
import { log } from '../lib/logger';

/**
 * A valid signature proves control of a key, NOT that the key is authorized.
 * `AUTHORIZED_SIGNER_ADDRESSES` is a comma-separated allowlist of trusted
 * signer addresses (e.g. the frontend's APP wallet), read per-request so
 * addresses can be rotated without a restart.
 *
 * Default-deny: when the list is unset/empty, no signature is promoted to an
 * agent identity. This is safe because every legitimate caller (the frontend)
 * also sends its Bearer token alongside the signature — unknown signers simply
 * fall through to the Bearer gate instead of being handed `role: 'agent'`.
 */
function isAuthorizedSigner(address: string): boolean {
  const allow = (process.env.AUTHORIZED_SIGNER_ADDRESSES || '')
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(address.toLowerCase());
}

/**
 * SignatureGuard — Verifies cryptographic signatures from agents or users.
 *
 * This middleware promotes "Identity as a Fact". Instead of relying on
 * shared secrets (API Keys), it verifies that the request was explicitly
 * signed by the holder of a private key.
 *
 * Expected headers:
 * - x-agent-signature: The hex-encoded signature
 * - x-agent-address: The Ethereum-compatible address of the signer
 * - x-agent-timestamp: Epoch milliseconds (to prevent replay attacks)
 *
 * Signature Message Format:
 * "${METHOD}:${PATH}:${CANONICAL_BODY}:${TIMESTAMP}"
 *
 * `CANONICAL_BODY` is produced by canonicalJsonStringify (sorted keys, stable
 * across Node versions). The previous implementation used JSON.stringify
 * which, while deterministic for any single object, depended on property
 * insertion order — silently breaking signatures whenever a serializer
 * reordered fields. The canonical form is a strict superset of valid JSON
 * and signers/verifiers must agree byte-for-byte.
 */
export async function signatureGuard(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-agent-signature'] as string;
  const address = req.headers['x-agent-address'] as string;
  const timestamp = req.headers['x-agent-timestamp'] as string;

  // If signature headers are missing, we skip this guard and allow
  // downstream auth (like Bearer token) to attempt validation.
  if (!signature || !address || !timestamp) {
    return next();
  }

  try {
    // 1. Replay protection: verify timestamp is within a 5-minute window.
    const ts = parseInt(timestamp, 10);
    const now = Date.now();
    if (isNaN(ts) || Math.abs(now - ts) > 300_000) {
      return res.status(401).json({
        error: 'Invalid or expired timestamp',
        code: 'TIMESTAMP_EXPIRED'
      });
    }

    // 2. Reconstruct the signed message.
    // NOTE: Body must be parsed by express.json() BEFORE this guard runs.
    // Empty bodies are signed as "" (matches signedFetch).
    const hasBody = req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0;
    const bodyStr = hasBody ? canonicalJsonStringify(req.body) : '';
    const message = `${req.method.toUpperCase()}:${req.path}:${bodyStr}:${timestamp}`;

    // 3. Recover address from signature.
    const recoveredAddress = verifyMessage(message, signature);

    // 4. Validate recovery match.
    if (getAddress(recoveredAddress) !== getAddress(address)) {
      return res.status(401).json({
        error: 'Signature verification failed',
        code: 'INVALID_SIGNATURE'
      });
    }

    // 5. A valid signature proves control of the key, not authorization.
    // Without an allowlist, any self-generated keypair would be promoted to
    // `role: 'agent'` and — via the Bearer gate's agent short-circuit — bypass
    // INTERNAL_API_KEY on every protected route (including /api/orchestration,
    // which executes tools). Only promote allowlisted signers; otherwise fall
    // through and let the Bearer gate decide.
    if (!isAuthorizedSigner(address)) {
      log.warn('[SignatureGuard] Valid signature from non-authorized signer — not granting agent identity', {
        details: { address: address.toLowerCase() },
      })
      return next();
    }

    // 6. Attach verified identity to the request.
    req.userId = address.toLowerCase();
    req.userRole = 'agent'; // Address-based identities are treated as agent-class

    // Identity is now a verified fact. Proceed.
    log.info('[SignatureGuard] Verified identity', { details: { userId: req.userId } })
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('[SignatureGuard] Verification error', { error: { error: message } })
    res.status(401).json({
      error: 'Signature verification error',
      code: 'SIGNATURE_ERROR'
    });
  }
}
