import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

const API_KEY = process.env.INTERNAL_API_KEY;

/**
 * Auth middleware — timing-safe to prevent key-enumeration attacks.
 *
 * If `signatureGuard` already verified the request and populated `req.userId`
 * with `req.userRole === 'agent'`, this middleware passes through. Otherwise
 * it requires a Bearer token matching `INTERNAL_API_KEY`.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Identity is a Fact: If signatureGuard already verified the request,
  // we proceed directly.
  if (req.userId && req.userRole === 'agent') {
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);
  const tokenBuf = Buffer.from(token);
  const keyBuf = Buffer.from(API_KEY || '');
  if (!API_KEY || tokenBuf.length !== keyBuf.length || !timingSafeEqual(tokenBuf, keyBuf)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
