import { Router, Request, Response } from 'express';
import { pool } from '../lib/db';
import { log } from '../lib/logger';
import { safeCompare } from '../lib/safe-compare';

const router = Router();

// Auth helper for cron endpoints
const authenticateCron = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  const expected = process.env.CRON_SECRET || '';
  
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.substring(7);
  if (!safeCompare(token, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * GET /api/cron/x-monitor
 * 
 * THE KEY MISSING PIECE:
 * 1. Find all users with X connected
 * 2. Fetch mentions from X
 * 3. Auto-generate drafts for new mentions
 */
router.get('/x-monitor', authenticateCron, async (req: Request, res: Response) => {
  log.info('Cron', { details: { event: 'x_monitor_start' } })

  try {
    // 1. Find users with X connected
    const usersWithX = await pool.query(
      'SELECT "userId", value FROM "UserSetting" WHERE key = $1',
      ['x_api_account']
    );

    const results: any[] = [];

    for (const row of usersWithX.rows) {
      const userId = row.userId;
      
      // 2. Fetch mentions and generate drafts (Placeholder for actual API logic)
      // In a real implementation, we'd use the X credentials from row.value
      
      log.info('Cron', { details: { event: 'x_monitor_user_processed', userId } })
      
      // 3. Append draft to queue if found new mentions
      // This part would update the "x_draft_queue" key in "UserSetting"
      
      results.push({ userId, status: 'processed_placeholder' });
    }

    res.json({ success: true, processed: results.length, results });
  } catch (error) {
    log.error('Cron', { error: { event: 'x_monitor_failed', error: String(error) } })
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
