import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Auth Middleware (user-context extraction for internal routes)
 *
 * SECURITY MODEL: This middleware verifies user context headers via HMAC
 * signature. The frontend signs a payload containing user claims with a
 * shared secret (HMAC_SECRET), and the backend verifies the signature
 * before trusting the headers.
 *
 * The outer security boundary is the Bearer token check in index.ts, which
 * prevents direct external access to the API.
 *
 * RISK: If the INTERNAL_API_KEY is ever exposed to a browser/client, an
 * attacker could forge these headers to impersonate any user or admin.
 * Mitigation: rotate INTERNAL_API_KEY immediately if exposed; never embed
 * it in client-side code.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
// HMAC_SECRET and INTERNAL_API_KEY serve different purposes:
// - INTERNAL_API_KEY: Bearer token for outer auth gate (API access)
// - HMAC_SECRET: HMAC signing key for user context headers (impersonation protection)
// Falling back to INTERNAL_API_KEY conflates the two and breaks routes that
// should be accessible without HMAC-signed headers (register-home, heartbeat).
const HMAC_SECRET = process.env.HMAC_SECRET || '';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

// Signed-header replay window. We accept signatures issued within this window
// of "now" (clock skew + in-flight latency). Anything older is rejected to
// prevent replay of captured headers across long-lived sessions.
const SIGNATURE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Verify HMAC signature on user context headers.
 *
 * Old format: HMAC(userId:userEmail:userRole)
 *   — signature was identical for every request, so a captured signature
 *     could be replayed forever and across every endpoint.
 *
 * New format: HMAC(METHOD:PATH:userId:userEmail:userRole:timestamp)
 *   — binds the signature to a specific endpoint + a 5-minute window, so
 *     captured signatures expire and can't be reused on a different route.
 *
 * PATH is the FULL request path the client signed (e.g. "/api/provision").
 * This middleware runs inside a mounted router, where Express rewrites
 * `req.path` to the router-relative path ("/"), so the caller must pass the
 * reconstructed full path (see `signedPath`) — not `req.path`.
 *
 * `timestamp` is sent in the `x-user-signature-timestamp` header (Unix ms).
 */
function verifyUserSignature(
  method: string,
  path: string,
  userId: string,
  userEmail: string,
  userRole: string,
  timestamp: string,
  signature: string
): boolean {
  if (!HMAC_SECRET || !signature) return false;
  const payload = `${method.toUpperCase()}:${path}:${userId}:${userEmail}:${userRole}:${timestamp}`;
  const expected = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payload)
    .digest('hex');
  // Reject invalid hex or wrong length before calling timingSafeEqual
  // (timingSafeEqual throws on length mismatch — that exception leaks timing info)
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Reconstructs the full request path the client signed. `req.originalUrl`
 * preserves the path before Express strips the router mount prefix; we drop
 * any query string so the value matches the frontend's `signedFetch`.
 */
function signedPath(req: Request): string {
  const original = req.originalUrl || req.url || req.path || '';
  const qIndex = original.indexOf('?');
  return qIndex === -1 ? original : original.slice(0, qIndex);
}

/**
 * Extracts and attaches user context from frontend headers.
 * Verifies HMAC signature to prevent header forgery and replay.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const userEmail = (req.headers['x-user-email'] as string) || '';
  const userId = (req.headers['x-user-id'] as string) || '';
  const userRole = (req.headers['x-user-role'] as string) || 'user';
  const signature = (req.headers['x-user-signature'] as string) || '';
  const tsHeader = (req.headers['x-user-signature-timestamp'] as string) || '';

  // If HMAC_SECRET is configured, require a valid timestamped signature.
  if (HMAC_SECRET) {
    if (!signature || !tsHeader) {
      return res.status(401).json({
        error: 'Missing x-user-signature or x-user-signature-timestamp header',
        code: 'SIGNATURE_REQUIRED',
      });
    }

    const ts = Number(tsHeader);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > SIGNATURE_WINDOW_MS) {
      return res.status(401).json({
        error: 'Signature timestamp outside replay window',
        code: 'SIGNATURE_EXPIRED',
      });
    }

    if (!verifyUserSignature(req.method, signedPath(req), userId, userEmail, userRole, tsHeader, signature)) {
      return res.status(401).json({
        error: 'Invalid user signature',
        code: 'INVALID_SIGNATURE',
      });
    }
  }

  req.userId = userId || 'anonymous';
  req.userEmail = userEmail || '';
  req.userRole = userRole || 'user';

  next();
}

/**
 * Lightweight user-context extraction WITHOUT HMAC enforcement.
 *
 * For agent/installer-facing routes (register-home, register-link, heartbeat)
 * that are authenticated by the Bearer INTERNAL_API_KEY at the edge (see
 * public/install.sh, public/link.sh) and carry their subject in the request
 * body. These must stay reachable even when HMAC_SECRET is enabled — which
 * gates the user-context routes — so they intentionally do NOT require an
 * x-user-signature. Without this exemption, turning on HMAC_SECRET would 401
 * every agent registration/heartbeat.
 */
export function extractUserContext(req: Request, _res: Response, next: NextFunction) {
  req.userId = (req.headers['x-user-id'] as string) || 'anonymous';
  req.userEmail = (req.headers['x-user-email'] as string) || '';
  req.userRole = (req.headers['x-user-role'] as string) || 'user';
  next();
}

/**
 * Admin-only middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userEmail || !ADMIN_EMAILS.includes(req.userEmail)) {
    return res.status(403).json({
      error: 'Admin access required.',
      code: 'ADMIN_REQUIRED',
    });
  }
  next();
}
