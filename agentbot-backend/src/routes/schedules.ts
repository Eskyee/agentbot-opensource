import { log } from '../lib/logger';
import { Router, Request, Response } from 'express';
import { pool } from '../lib/db';

/**
 * CRUD over the scheduled_tasks table (DB-backed, owned per user).
 *
 * scheduled_tasks is a one-shot due-time queue: the scheduler worker claims
 * rows where next_run_at <= NOW() and POSTs to config.agentUrl/execute. There
 * is no cron recurrence in the worker, so `cron` is stored in config for
 * reference and `runAt` controls when a task fires (defaults to now).
 */
const router = Router();

interface ScheduleConfig {
  name?: string;
  cron?: string;
  prompt?: string;
  agentUrl?: string;
}

// Fail closed: scheduled_tasks rows are owned per user. If no authenticated
// user identity is attached we refuse, rather than silently reading/writing
// rows owned by NULL (or by whatever shared signer identity happened to be
// attached upstream), which would leak tasks across users.
function getOwnerId(req: Request, res: Response): string | null {
  const userId = req.userId;
  if (!userId || userId === 'anonymous') {
    res.status(401).json({ error: 'Authenticated user context required' });
    return null;
  }
  return userId;
}

// GET /api/schedules — list the caller's scheduled tasks
router.get('/', async (req: Request, res: Response) => {
  const userId = getOwnerId(req, res);
  if (!userId) return;
  try {
    const result = await pool.query(
      `SELECT id, agent_id, user_id, config, status,
              next_run_at, last_run_at, attempts, max_attempts, error, created_at, updated_at
       FROM scheduled_tasks
       WHERE user_id = $1
       ORDER BY next_run_at ASC
       LIMIT 200`,
      [userId]
    );
    res.json({ tasks: result.rows });
  } catch (error: unknown) {
    log.error('[schedules] list failed', { error: { message: error instanceof Error ? error.message : String(error) } });
    res.status(500).json({ error: 'Failed to list scheduled tasks' });
  }
});

// POST /api/schedules — create a scheduled task for the caller
router.post('/', async (req: Request, res: Response) => {
  const userId = getOwnerId(req, res);
  if (!userId) return;
  const { agentId, name, cron, prompt, agentUrl, runAt } = req.body as {
    agentId?: string; name?: string; cron?: string; prompt?: string; agentUrl?: string; runAt?: string;
  };

  let nextRunAt: Date;
  if (runAt) {
    nextRunAt = new Date(runAt);
    if (Number.isNaN(nextRunAt.getTime())) {
      return res.status(400).json({ error: 'runAt must be a valid ISO 8601 date-time' });
    }
  } else {
    nextRunAt = new Date();
  }

  const config: ScheduleConfig = {};
  if (name) config.name = name;
  if (cron) config.cron = cron;
  if (prompt) config.prompt = prompt;
  if (agentUrl) config.agentUrl = agentUrl;

  try {
    const result = await pool.query(
      `INSERT INTO scheduled_tasks (agent_id, user_id, config, status, next_run_at)
       VALUES ($1, $2, $3::jsonb, 'pending', $4)
       RETURNING id, agent_id, user_id, config, status, next_run_at, created_at`,
      [agentId ?? null, userId, JSON.stringify(config), nextRunAt.toISOString()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    log.error('[schedules] create failed', { error: { message: error instanceof Error ? error.message : String(error) } });
    res.status(500).json({ error: 'Failed to create scheduled task' });
  }
});

// DELETE /api/schedules/:id — delete one of the caller's scheduled tasks
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getOwnerId(req, res);
  if (!userId) return;
  const id = req.params.id;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM scheduled_tasks WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Scheduled task not found' });
    }
    res.json({ ok: true, deleted: id });
  } catch (error: unknown) {
    log.error('[schedules] delete failed', { error: { message: error instanceof Error ? error.message : String(error) } });
    res.status(500).json({ error: 'Failed to delete scheduled task' });
  }
});

export default router;
