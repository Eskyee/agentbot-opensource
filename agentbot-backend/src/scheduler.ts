/**
 * Inline scheduled tasks — replaces the separate BullMQ worker service.
 * Import and call startScheduler() from the main API process.
 * No Redis needed. Uses setInterval + direct DB queries.
 *
 * Reliability contract (matches platform_jobs):
 *   1. Task rows are claimed atomically with FOR UPDATE SKIP LOCKED so
 *      multiple replicas / overlapping ticks never process the same row.
 *   2. A task is only marked 'completed' if the downstream agent call
 *      actually succeeded. On failure we either re-queue with exponential
 *      backoff (attempts < max_attempts) or mark 'failed' so it is visible.
 *   3. Each interval is guarded by an isRunning flag — setInterval does NOT
 *      skip a tick when the previous async callback is still in flight, so
 *      without this flag a slow Railway provisioning pass would spawn an
 *      unbounded number of concurrent processors.
 */

import { processPlatformJobs } from './services/platform-jobs';
import { pool } from './lib/db';
import { log } from './lib/logger';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let platformJobInterval: ReturnType<typeof setInterval> | null = null;

// Overlap guards — see header comment.
let scheduledTasksRunning = false;
let platformJobsRunning = false;

interface ClaimedTask {
  id: string | number;
  agent_id: string | null;
  user_id: string | null;
  config: { agentUrl?: string } | null;
  attempts: number;
  max_attempts: number;
}

/**
 * Atomically claim up to `limit` due tasks. Mirrors platform_jobs.claimNextJob:
 * the SELECT ... FOR UPDATE SKIP LOCKED inside a CTE runs in the same statement
 * as the UPDATE, so no other replica/tick can claim the same row.
 */
async function claimDueTasks(limit: number): Promise<ClaimedTask[]> {
  const result = await pool.query<ClaimedTask>(
    `WITH due AS (
       SELECT id
       FROM scheduled_tasks
       WHERE status = 'pending' AND next_run_at <= NOW()
       ORDER BY next_run_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE scheduled_tasks t
     SET
       status      = 'running',
       attempts    = t.attempts + 1,
       last_run_at = NOW(),
       locked_at   = NOW(),
       updated_at  = NOW()
     FROM due
     WHERE t.id = due.id
     RETURNING t.id, t.agent_id, t.user_id, t.config, t.attempts, t.max_attempts`,
    [limit]
  );
  return result.rows;
}

/**
 * Recover tasks whose worker died mid-flight (status='running' for >10min with
 * no completion). Same pattern as requeueStaleRunningJobs in platform-jobs.
 */
async function requeueStaleRunningTasks(): Promise<void> {
  await pool.query(
    `UPDATE scheduled_tasks
     SET
       status      = 'pending',
       locked_at   = NULL,
       next_run_at = NOW(),
       updated_at  = NOW(),
       error       = COALESCE(error, 'Recovered after stale worker lock')
     WHERE status = 'running'
       AND locked_at IS NOT NULL
       AND locked_at < NOW() - INTERVAL '10 minutes'`
  );
}

async function markCompleted(taskId: ClaimedTask['id']): Promise<void> {
  await pool.query(
    `UPDATE scheduled_tasks
     SET status = 'completed', locked_at = NULL, error = NULL, updated_at = NOW()
     WHERE id = $1`,
    [taskId]
  );
}

async function markFailureOrRetry(task: ClaimedTask, errorMessage: string): Promise<void> {
  const shouldRetry = task.attempts < task.max_attempts;
  if (shouldRetry) {
    // Linear-then-capped backoff (30s * attempts, max 5min) — matches platform_jobs.
    const backoffSeconds = Math.min(30 * task.attempts, 300);
    await pool.query(
      `UPDATE scheduled_tasks
       SET
         status      = 'pending',
         next_run_at = NOW() + ($2 || ' seconds')::interval,
         locked_at   = NULL,
         error       = $3,
         updated_at  = NOW()
       WHERE id = $1`,
      [task.id, String(backoffSeconds), errorMessage]
    );
    log.warn('[Scheduler] Task failed, retrying', {
      taskId: task.id,
      attempt: task.attempts,
      maxAttempts: task.max_attempts,
      retryIn: backoffSeconds,
      error: errorMessage,
    });
    return;
  }
  await pool.query(
    `UPDATE scheduled_tasks
     SET status = 'failed', locked_at = NULL, error = $2, updated_at = NOW()
     WHERE id = $1`,
    [task.id, errorMessage]
  );
  log.error('[Scheduler] Task permanently failed', {
    taskId: task.id,
    attempts: task.attempts,
    error: errorMessage,
  });
}

async function executeTask(task: ClaimedTask): Promise<void> {
  const agentUrl = task.config?.agentUrl;
  if (!agentUrl) {
    // No-op tasks (e.g. config-only) are still real work — mark completed.
    log.info('[Scheduler] Task has no agentUrl, completing as no-op', { taskId: task.id });
    await markCompleted(task.id);
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${agentUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, config: task.config }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (fetchErr: unknown) {
    const message = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    await markFailureOrRetry(task, `Agent fetch failed: ${message}`);
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    await markFailureOrRetry(
      task,
      `Agent ${agentUrl} returned ${res.status}: ${text.slice(0, 200) || res.statusText}`
    );
    return;
  }

  // We only care that the agent acknowledged. Body parsing is best-effort —
  // its failure should not flip the task back to pending.
  await res.json().catch(() => null);
  log.info('[Scheduler] Task completed successfully', { taskId: task.id });
  await markCompleted(task.id);
}

/**
 * Process scheduled tasks that are due. Atomic claim + per-task settle.
 */
async function processScheduledTasks(): Promise<void> {
  try {
    await requeueStaleRunningTasks();

    const tasks = await claimDueTasks(10);
    if (tasks.length === 0) return;

    for (const task of tasks) {
      try {
        await executeTask(task);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        log.error('[Scheduler] Unexpected error executing task', { taskId: task.id, error: message });
        await markFailureOrRetry(task, `Unhandled scheduler error: ${message}`).catch((e) =>
          log.error('[Scheduler] Failed to settle task after error', { taskId: task.id, error: String(e) })
        );
      }
    }
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    // 42P01 = undefined_table — DB schema not ready yet (race on first boot).
    if (code === '42P01') {
      log.warn('[Scheduler] scheduled_tasks table not ready yet, will retry next tick');
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error('[Scheduler] Error processing tasks', { error: message });
  }
}

/**
 * Log skill executions (stub — actual execution happens in agent containers).
 */
async function processSkillExecutions(): Promise<void> {
  // Skill execution is handled by the agent container, not the backend.
  // This is a no-op placeholder for future direct execution if needed.
}

async function tickScheduledTasks(): Promise<void> {
  if (scheduledTasksRunning) {
    // Previous tick still in flight — skip this one. Avoids unbounded concurrency
    // when DB or downstream agents are slow.
    return;
  }
  scheduledTasksRunning = true;
  try {
    await processScheduledTasks();
    await processSkillExecutions();
  } finally {
    scheduledTasksRunning = false;
  }
}

async function tickPlatformJobs(): Promise<void> {
  if (platformJobsRunning) return;
  platformJobsRunning = true;
  try {
    await processPlatformJobs();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error('[Scheduler] Platform jobs tick failed', { error: message });
  } finally {
    platformJobsRunning = false;
  }
}

/**
 * Start the scheduler. Runs every 30 seconds.
 * Call once from the main API process.
 */
export function startScheduler(): void {
  if (schedulerInterval || platformJobInterval) {
    log.info('[Scheduler] Already running');
    return;
  }

  // Fail-closed only when we're actually being started. Module import
  // (e.g. from RUN_MODE=api or from tests that import index.ts) never
  // reaches this branch. The pool itself is the shared singleton from
  // ./lib/db, so we only need to verify DATABASE_URL is present here.
  if (!process.env.DATABASE_URL) {
    throw new Error('scheduler: DATABASE_URL is not set; refusing to start');
  }

  log.info('[Scheduler] Starting inline task scheduler', { scheduledTaskInterval: '30s', platformJobInterval: '5s' });

  // Kick off immediately so we don't wait one full tick on boot.
  void tickScheduledTasks();
  void tickPlatformJobs();

  schedulerInterval = setInterval(() => {
    void tickScheduledTasks();
  }, 30_000);

  platformJobInterval = setInterval(() => {
    void tickPlatformJobs();
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
  log.info('[Scheduler] Stopped');
}
