/**
 * Agentbot Home/Link Registration Routes
 * Handles user registration for Home (self-hosted) and Link (existing OpenClaw) modes.
 */
import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import { authenticate } from '../middleware/auth';
import { Pool } from 'pg';

const router = Router();

// DB-backed registration store — survives restarts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * POST /api/validate-key
 * Validates an API key and returns user info.
 *
 * HIGH FIX: replaced trivial length-check with a proper SHA-256 hash DB lookup.
 * The raw Bearer token is never stored — only its SHA-256 hex digest is kept in
 * the api_keys table. Enumeration is impossible because user_id comes from the DB
 * row, not from a prefix of the key itself.
 */
router.post('/validate-key', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, error: 'Missing API key' });
  }

  const apiKey = authHeader.slice(7); // strip "Bearer "

  // Hash the raw key — raw keys are never stored or compared directly
  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  let row: { user_id: string; plan: string } | undefined;
  try {
    const result = await pool.query<{ user_id: string; plan: string }>(
      `SELECT user_id, plan FROM api_keys
       WHERE key_hash = $1 AND revoked = FALSE
       LIMIT 1`,
      [keyHash]
    );
    row = result.rows[0];

    if (row) {
      // Fire-and-forget: record when this key was last used
      pool.query(
        'UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1',
        [keyHash]
      ).catch((err: Error) => console.error('[ValidateKey] last_used_at update failed:', err.message));
    }
  } catch (err: any) {
    console.error('[ValidateKey] DB lookup failed:', err.message);
    return res.status(500).json({ valid: false, error: 'Internal error' });
  }

  if (!row) {
    return res.status(401).json({ valid: false, error: 'Invalid API key' });
  }

  res.json({
    valid: true,
    userId: row.user_id,
    plan: row.plan,
    features: ['dashboard', 'marketplace', 'analytics'],
  });
});

/**
 * POST /api/register-home
 * Registers a Home mode installation
 */
router.post('/register-home', authenticate, async (req: Request, res: Response) => {
  const { userId, mode, gatewayToken } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId required' });
  }

  try {
    await pool.query(
      `INSERT INTO agent_registrations (user_id, mode, gateway_token, registered_at, last_seen, status)
       VALUES ($1, $2, $3, NOW(), NOW(), 'active')
       ON CONFLICT (user_id) DO UPDATE
         SET mode = EXCLUDED.mode,
             gateway_token = COALESCE(EXCLUDED.gateway_token, agent_registrations.gateway_token),
             last_seen = NOW(),
             status = 'active'`,
      [userId, mode || 'home', gatewayToken || null]
    );
  } catch (err: any) {
    console.error('[Home] DB upsert failed:', err.message);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }

  console.log(`[Home] Registered user ${userId} (mode: ${mode || 'home'})`);
  res.json({
    success: true,
    message: 'Home installation registered',
    dashboardUrl: `https://agentbot.raveculture.xyz/dashboard`,
  });
});

/**
 * POST /api/register-link
 * Registers a Link mode installation (existing OpenClaw)
 */
router.post('/register-link', authenticate, async (req: Request, res: Response) => {
  const { userId, gatewayToken } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId required' });
  }

  try {
    await pool.query(
      `INSERT INTO agent_registrations (user_id, mode, gateway_token, registered_at, last_seen, status)
       VALUES ($1, 'link', $2, NOW(), NOW(), 'active')
       ON CONFLICT (user_id) DO UPDATE
         SET mode = 'link',
             gateway_token = COALESCE(EXCLUDED.gateway_token, agent_registrations.gateway_token),
             last_seen = NOW(),
             status = 'active'`,
      [userId, gatewayToken || null]
    );
  } catch (err: any) {
    console.error('[Link] DB upsert failed:', err.message);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }

  console.log(`[Link] Registered user ${userId} (mode: link)`);
  res.json({
    success: true,
    message: 'OpenClaw instance linked',
    dashboardUrl: `https://agentbot.raveculture.xyz/dashboard`,
  });
});

/**
 * GET /api/installations
 * Lists all registered installations
 */
router.get('/installations', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT user_id, mode, registered_at, last_seen, status
       FROM agent_registrations
       ORDER BY last_seen DESC`
    );
    res.json({
      success: true,
      count: result.rowCount,
      installations: result.rows,
    });
  } catch (err: any) {
    console.error('[Installations] DB query failed:', err.message);
    res.status(500).json({ success: false, error: 'Failed to list installations' });
  }
});

/**
 * POST /api/heartbeat
 * User agent pings to report status (upsert last_seen)
 */
router.post('/heartbeat', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (userId && typeof userId === 'string') {
    pool.query(
      `UPDATE agent_registrations SET last_seen = NOW(), status = 'active' WHERE user_id = $1`,
      [userId]
    ).catch((err: Error) => console.error('[Heartbeat] DB update failed:', err.message));
  }

  res.json({ success: true, timestamp: new Date().toISOString() });
});

export default router;
