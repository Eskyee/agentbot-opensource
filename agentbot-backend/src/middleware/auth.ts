import { Request, Response, NextFunction } from 'express';

/**
 * Auth Middleware (simplified for backend)
 * Uses API key auth (matches existing pattern in index.ts)
 * For JWT auth, use the web app's NextAuth
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
 * Auth middleware - matches existing API key pattern
 * Adds user context from headers (set by frontend)
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  // Get user info from headers (set by authenticated frontend)
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
