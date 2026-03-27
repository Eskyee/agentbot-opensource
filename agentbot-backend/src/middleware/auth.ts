import { Request, Response, NextFunction } from 'express';

/**
 * Auth Middleware (user-context extraction for internal routes)
 *
 * SECURITY MODEL: This middleware does NOT verify identity by itself.
 * It reads user context from headers that are TRUSTED to be set by the Next.js
 * frontend AFTER it has authenticated the user via NextAuth.
 *
 * The outer security boundary is the Bearer token check in index.ts, which
 * prevents direct external access to the API.  Within that boundary, the
 * frontend is responsible for setting correct x-user-* headers.
 *
 * RISK: If the INTERNAL_API_KEY is ever exposed to a browser/client, an
 * attacker could forge these headers to impersonate any user or admin.
 * Mitigation: rotate INTERNAL_API_KEY immediately if exposed; never embed
 * it in client-side code.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

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

/**
 * Extracts and attaches user context from trusted frontend headers.
 * NOTE: This does NOT perform cryptographic verification — it relies on the
 * outer Bearer-token middleware (index.ts authenticate) to gate API access.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  // Get user info from headers (set by authenticated frontend after NextAuth verification)
  const userEmail = req.headers['x-user-email'] as string;
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;

  // Attach to request
  req.userId = userId || 'anonymous';
  req.userEmail = userEmail || '';
  req.userRole = userRole || 'user';

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
