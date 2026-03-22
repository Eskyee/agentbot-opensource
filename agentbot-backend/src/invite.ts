import { randomBytes, timingSafeEqual } from 'crypto';
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();

// Persistent DB-backed invite code store (survives restarts)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Internal auth middleware — only internal callers may generate codes
const requireInternalAuth = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);
  const expected = process.env.INTERNAL_API_KEY || '';
  if (!expected) return res.status(401).json({ error: 'Unauthorized' });
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Generate a new invite code — REQUIRES internal auth to prevent invite flooding
router.post('/generate', requireInternalAuth, async (req: Request, res: Response) => {
  const code = randomBytes(6).toString('hex');
  try {
    await pool.query(
      'INSERT INTO invite_codes (code, used, created_at) VALUES ($1, FALSE, NOW())',
      [code]
    );
    res.json({ code });
  } catch (err: any) {
    console.error('[Invite] Failed to persist invite code:', err.message);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// Validate and consume an invite code (atomic — prevents double-use)
router.post('/validate', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string' || code.length !== 12) {
    return res.status(400).json({ valid: false });
  }

  try {
    // UPDATE … RETURNING is atomic: only one concurrent request can mark a code as used
    const result = await pool.query(
      `UPDATE invite_codes
         SET used = TRUE, used_at = NOW()
       WHERE code = $1 AND used = FALSE
       RETURNING code`,
      [code]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ valid: false });
    }
    res.json({ valid: true });
  } catch (err: any) {
    console.error('[Invite] Failed to validate invite code:', err.message);
    res.status(500).json({ error: 'Failed to validate invite code' });
  }
});

export default router;
