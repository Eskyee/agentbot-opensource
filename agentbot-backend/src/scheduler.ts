/**
 * Inline scheduled tasks — replaces the separate BullMQ worker service.
 * Import and call startScheduler() from the main API process.
 * No Redis needed. Uses setInterval + direct DB queries.
 */

import { Pool } from 'pg';
import { processPlatformJobs } from './services/platform-jobs';

const DATABASE_URL = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString: DATABASE_URL });

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let platformJobInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Process scheduled tasks that are due.
 * Checks the scheduled_tasks table for tasks with status 'pending'
 * and next_run_at <= NOW().
 */
async function processScheduledTasks(): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT id, agent_id, user_id, config FROM scheduled_tasks 
       WHERE status = 'pending' AND next_run_at <= NOW() 
       LIMIT 10`
    );

    for (const task of result.rows) {
      const { id: taskId, agent_id: agentId, user_id: userId, config: taskConfig } = task;
      
      console.log(`[Scheduler] Executing task ${taskId} for agent ${agentId}`);
      
      // Mark as running
      await pool.query(
        `UPDATE scheduled_tasks SET status = 'running', last_run_at = NOW() WHERE id = $1`,
        [taskId]
      ).catch(err => console.error(`[Scheduler] Failed to update task status:`, err));

      // Call agent if URL configured
      const agentUrl = taskConfig?.agentUrl;
      if (agentUrl) {
        try {
          const res = await fetch(`${agentUrl}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, config: taskConfig }),
            signal: AbortSignal.timeout(30000),
          });
          const result = await res.json();
          console.log(`[Scheduler] Task ${taskId} completed:`, result);
        } catch (fetchErr: any) {
          console.error(`[Scheduler] Task ${taskId} agent call failed:`, fetchErr.message);
        }
      }

      // Mark completed
      await pool.query(
        `UPDATE scheduled_tasks SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [taskId]
      ).catch(err => console.error(`[Scheduler] Failed to mark task completed:`, err));
    }
  } catch (err: any) {
    // 42P01 = undefined_table — DB schema not ready yet (race on first boot)
    if (err.code === '42P01') {
      console.warn('[Scheduler] scheduled_tasks table not ready yet — will retry next tick');
      return;
    }
    console.error('[Scheduler] Error processing tasks:', err.message);
  }
}

/**
 * Log skill executions (stub — actual execution happens in agent containers).
 */
async function processSkillExecutions(): Promise<void> {
  // Skill execution is handled by the agent container, not the backend.
  // This is a no-op placeholder for future direct execution if needed.
}

/**
 * Start the scheduler. Runs every 30 seconds.
 * Call once from the main API process.
 */
export function startScheduler(): void {
  if (schedulerInterval || platformJobInterval) {
    console.log('[Scheduler] Already running');
    return;
  }

  console.log('[Scheduler] Starting inline task scheduler (scheduled tasks every 30s, platform jobs every 5s)');
  
  // Run immediately on start, then every 30 seconds
  processScheduledTasks();
  processPlatformJobs().catch((err) => console.error('[Scheduler] Platform jobs failed:', err));
  
  schedulerInterval = setInterval(async () => {
    await processScheduledTasks();
    await processSkillExecutions();
  }, 30_000);

  platformJobInterval = setInterval(async () => {
    await processPlatformJobs();
  }, 5_000);
}

/**
 * Stop the scheduler gracefully.
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  if (platformJobInterval) {
    clearInterval(platformJobInterval);
    platformJobInterval = null;
  }
  console.log('[Scheduler] Stopped');
}
