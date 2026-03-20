import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request with user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'djescaba@icloud.com,eskyjunglelab@gmail.com').split(',');

/**
 * Auth Middleware
 * - Validates JWT token
 * - Sets user context for RLS
 * - Attaches userId to request
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required. Provide Bearer token.',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // Set user context for RLS
    // This MUST happen before any database query
    await prisma.$executeRaw`SELECT set_current_user_id(${decoded.userId})`;

    // Attach to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid or expired token.',
        code: 'TOKEN_INVALID',
      });
    }

    console.error('[Auth] Error:', error);
    return res.status(500).json({
      error: 'Authentication failed.',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Admin-only middleware
 * Must be used AFTER authenticate()
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

/**
 * Generate JWT token for a user
 */
export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
