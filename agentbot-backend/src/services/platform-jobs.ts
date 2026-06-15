import { log } from "../lib/logger";
import { randomBytes } from 'crypto';
import { provisionOnRailway, type TailscaleProvisionOptions } from '../routes/railway-provision';
import { snapshotAgentState } from './gitlawb';
import { pool } from '../lib/db';

export type PlatformJobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type PlatformJobType = 'provision_managed_runtime' | 'gateway_chat_completion' | 'runtime_sync' | 'retry_repair';
export type PlatformJobLane = 'deploy' | 'runtime_exec' | 'recovery';

export interface PlatformJobRow {
  id: string;
  user_id: string | null;
  agent_id: string | null;
  lane: PlatformJobLane;
  job_type: PlatformJobType;
  status: PlatformJobStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  run_at: string;
  locked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

type QueueProvisionPayload = {
  userId: string;
  email: string;
  agentId: string;
  plan: string;
  aiProvider?: string;
  agentType?: string;
  autoProvision?: boolean;
  stripeSubscriptionId?: string | null;
  tailscale?: TailscaleProvisionOptions | null;
};

type QueueChatPayload = {
  userId: string;
  agentId: string;
  gatewayUrl: string;
  message: string;
  systemPrompt?: string | null;
};

async function persistProvisionCompletion(params: {
  userId: string;
  agentId: string;
  url: string;
  plan: string;
  aiProvider: string;
  agentType: string;
  status: string;
}) {
  const managedAgentUrl = params.url.replace(/\/$/, '');
  const name = params.agentType === 'business' ? 'OpenClaw Agent' : 'Agentbot Agent';
  const config = {
    managed: true,
    provisionSource: 'backend/platform_jobs',
    agentType: params.agentType,
    plan: params.plan,
    aiProvider: params.aiProvider,
    openclawUrl: managedAgentUrl,
  };

  // Wrap both updates in a transaction — if Agent upsert fails, User is not left
  // pointing at a URL that has no corresponding Agent record.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE "User"
       SET "openclawUrl" = $2,
           "openclawInstanceId" = $3
       WHERE "id" = $1`,
      [params.userId, managedAgentUrl, params.agentId]
    );

    await client.query(
      `INSERT INTO "Agent"
        ("id", "userId", "name", "model", "status", "websocketUrl", "config", "createdAt", "updatedAt", "tier", "showcaseOptIn", "showcaseDescription")
       VALUES
        ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW(), $8, FALSE, '')
       ON CONFLICT ("id") DO UPDATE
       SET
        "name" = EXCLUDED."name",
        "model" = EXCLUDED."model",
        "status" = EXCLUDED."status",
        "websocketUrl" = EXCLUDED."websocketUrl",
        "tier" = EXCLUDED."tier",
        "config" = COALESCE("Agent"."config", '{}'::jsonb) || EXCLUDED."config",
        "updatedAt" = NOW()`,
      [
        params.agentId,
        params.userId,
        name,
        params.aiProvider,
        params.status,
        managedAgentUrl,
        JSON.stringify(config),
        params.plan,
      ]
    );

    await client.query('COMMIT');

    // State is a Fact: Snapshot the final agent state to gitlawb
    await snapshotAgentState(params.agentId, {
      id: params.agentId,
      userId: params.userId,
      name,
      model: params.aiProvider,
      status: params.status,
      websocketUrl: managedAgentUrl,
      config,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function makeJobId(): string {
  return `job_${randomBytes(8).toString('hex')}`;
}

function sanitizeJob(row: PlatformJobRow) {
  const payload = row.payload || {};
  const tailscalePayload =
    payload.tailscale && typeof payload.tailscale === 'object'
      ? payload.tailscale as Record<string, unknown>
      : null;
  const safePayload = {
    userId: typeof payload.userId === 'string' ? payload.userId : row.user_id,
    agentId: typeof payload.agentId === 'string' ? payload.agentId : row.agent_id,
    plan: typeof payload.plan === 'string' ? payload.plan : null,
    aiProvider: typeof payload.aiProvider === 'string' ? payload.aiProvider : null,
    agentType: typeof payload.agentType === 'string' ? payload.agentType : null,
    autoProvision: payload.autoProvision === true,
    tailscale: tailscalePayload?.enabled === true
      ? {
          enabled: true,
          mode: typeof tailscalePayload.mode === 'string' ? tailscalePayload.mode : 'serve',
          hostname: typeof tailscalePayload.hostname === 'string' ? tailscalePayload.hostname : null,
          tags: Array.isArray(tailscalePayload.tags) ? tailscalePayload.tags : [],
          acceptRoutes: tailscalePayload.acceptRoutes !== false,
          resetOnExit: tailscalePayload.resetOnExit === true,
        }
      : null,
  };

  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    lane: row.lane,
    jobType: row.job_type,
    status: row.status,
    priority: row.priority,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    runAt: row.run_at,
    lockedAt: row.locked_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    error: row.error,
    result: row.result,
    payload: safePayload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function enqueueProvisionJob(payload: QueueProvisionPayload) {
  const id = makeJobId();

  const result = await pool.query<PlatformJobRow>(
    `INSERT INTO platform_jobs
      (id, user_id, agent_id, lane, job_type, status, priority, attempts, max_attempts, payload)
     VALUES
      ($1, $2, $3, 'deploy', 'provision_managed_runtime', 'queued', 100, 0, 5, $4::jsonb)
     RETURNING *`,
    [id, payload.userId, payload.agentId, JSON.stringify(payload)]
  );

  return sanitizeJob(result.rows[0]);
}

export async function enqueueGatewayChatJob(payload: QueueChatPayload) {
  const id = makeJobId();

  const result = await pool.query<PlatformJobRow>(
    `INSERT INTO platform_jobs
      (id, user_id, agent_id, lane, job_type, status, priority, attempts, max_attempts, payload)
     VALUES
      ($1, $2, $3, 'runtime_exec', 'gateway_chat_completion', 'queued', 50, 0, 3, $4::jsonb)
     RETURNING *`,
    [id, payload.userId, payload.agentId, JSON.stringify(payload)]
  );

  return sanitizeJob(result.rows[0]);
}

export async function getPlatformJob(jobId: string) {
  const result = await pool.query<PlatformJobRow>(
    `SELECT *
     FROM platform_jobs
     WHERE id = $1
     LIMIT 1`,
    [jobId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return sanitizeJob(result.rows[0]);
}

export async function getPlatformJobMetrics() {
  const [counts, oldestQueued] = await Promise.all([
    pool.query<{ lane: string; status: string; count: string }>(
      `SELECT lane, status, COUNT(*)::text AS count
       FROM platform_jobs
       GROUP BY lane, status`
    ),
    pool.query<{ age_seconds: string | null }>(
      `SELECT EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))::text AS age_seconds
       FROM platform_jobs
       WHERE status = 'queued'`
    ),
  ]);

  return {
    counts: counts.rows.map((row) => ({
      lane: row.lane,
      status: row.status,
      count: Number(row.count),
    })),
    oldestQueuedAgeSeconds: oldestQueued.rows[0]?.age_seconds ? Number(oldestQueued.rows[0].age_seconds) : 0,
  };
}

async function claimNextJob(): Promise<PlatformJobRow | null> {
  const result = await pool.query<PlatformJobRow>(
    `WITH next_job AS (
       SELECT id
       FROM platform_jobs
       WHERE status = 'queued'
         AND run_at <= NOW()
       ORDER BY priority DESC, created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE platform_jobs jobs
     SET
       status = 'running',
       attempts = jobs.attempts + 1,
       started_at = COALESCE(jobs.started_at, NOW()),
       locked_at = NOW(),
       updated_at = NOW()
     FROM next_job
     WHERE jobs.id = next_job.id
     RETURNING jobs.*`
  );

  return result.rows[0] || null;
}

async function completeJob(jobId: string, resultPayload: Record<string, unknown>) {
  await pool.query(
    `UPDATE platform_jobs
     SET
       status = 'completed',
       completed_at = NOW(),
       updated_at = NOW(),
       locked_at = NULL,
       result = $2::jsonb,
       error = NULL
     WHERE id = $1`,
    [jobId, JSON.stringify(resultPayload)]
  );
}

/**
 * Marker error for permanent failures. The outer dispatch loop catches
 * this and forwards `permanent=true` to failJob so the job is failed
 * immediately instead of burning the remaining retry budget.
 */
class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentJobError';
  }
}

/**
 * Mark a job as failed.
 *
 * If `permanent` is true, the job goes straight to the terminal `failed`
 * status and never retries — used for errors we know up-front are not
 * transient (malformed payload, invalid URL, missing token, etc.).
 *
 * Otherwise the job is requeued with backoff while attempts remain, and
 * only flips to `failed` once attempts have been exhausted.
 */
async function failJob(
  job: PlatformJobRow,
  errorMessage: string,
  permanent = false
) {
  const shouldRetry = !permanent && job.attempts < job.max_attempts;

  if (shouldRetry) {
    const retryDelaySeconds = Math.min(30 * job.attempts, 300);
    await pool.query(
      `UPDATE platform_jobs
       SET
         status = 'queued',
         run_at = NOW() + ($2 || ' seconds')::interval,
         updated_at = NOW(),
         locked_at = NULL,
         error = $3
       WHERE id = $1`,
      [job.id, String(retryDelaySeconds), errorMessage]
    );
    return;
  }

  await pool.query(
    `UPDATE platform_jobs
     SET
       status = 'failed',
       updated_at = NOW(),
       completed_at = NOW(),
       locked_at = NULL,
       error = $2
     WHERE id = $1`,
    [job.id, errorMessage]
  );
}

async function processProvisionJob(job: PlatformJobRow) {
  const payload = job.payload as unknown as QueueProvisionPayload;
  const result = await provisionOnRailway(payload.agentId, payload.plan || 'solo', payload.tailscale || null);

  // M-9: persist the Agent/User state. The Railway service is already up by
  // this point, so a persist failure does NOT entitle us to retry — that
  // would re-deploy a duplicate Railway service and we'd never reconcile it
  // back to the User. Instead, capture the failure, log a treasury_transactions
  // row of type='orphan_railway_service', and complete the job so an operator
  // can reconcile manually.
  let persistFailure: string | null = null;
  try {
    await persistProvisionCompletion({
      userId: payload.userId,
      agentId: payload.agentId,
      url: result.url,
      plan: payload.plan || 'solo',
      aiProvider: payload.aiProvider || 'openrouter',
      agentType: payload.agentType || 'creative',
      status: result.status,
    });
  } catch (err) {
    persistFailure = err instanceof Error ? err.message : String(err);
    log.error(
      `[Platform-jobs] Persist failed for ${payload.agentId} (Railway service is live at ${result.url}); recording orphan_railway_service for manual reconciliation:`,
      { error: persistFailure }
    );
    await pool.query(
      `INSERT INTO treasury_transactions (type, category, action, description, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        'orphan_railway_service',
        'provision',
        'persist_failed',
        `Railway service deployed for agent ${payload.agentId} but DB persist failed: ${persistFailure}`,
        'needs_reconciliation',
        JSON.stringify({
          agentId: payload.agentId,
          userId: payload.userId,
          railwayUrl: result.url,
          plan: payload.plan || 'solo',
          aiProvider: payload.aiProvider || 'openrouter',
          agentType: payload.agentType || 'creative',
          provisionStatus: result.status,
          jobId: job.id,
          persistError: persistFailure,
        }),
      ]
    ).catch((logErr: Error) => {
      // If even the orphan log fails, fall back to a console-error breadcrumb
      // so an operator at least sees something in the logs.
      log.error('[Platform-jobs] Failed to log orphan_railway_service:', { error: logErr.message })
    });
  }

  await completeJob(job.id, {
    ...result,
    plan: payload.plan,
    aiProvider: payload.aiProvider || 'openrouter',
    agentType: payload.agentType || 'creative',
    queuedUserId: payload.userId,
    agentId: payload.agentId,
    persistFailure,
  });
}

async function requeueStaleRunningJobs(): Promise<void> {
  // M-11: tighten stale-running window from 10 minutes to 3 minutes for
  // chat/gateway lanes (which complete in < 60s on the happy path) while
  // keeping a longer window for provision (Railway can legitimately take 5
  // minutes to spin up a new service).
  await pool.query(
    `UPDATE platform_jobs
     SET
       status = 'queued',
       locked_at = NULL,
       run_at = NOW(),
       updated_at = NOW(),
       error = COALESCE(error, 'Recovered after stale worker lock')
     WHERE status = 'running'
       AND locked_at IS NOT NULL
       AND (
         (job_type = 'gateway_chat_completion' AND locked_at < NOW() - INTERVAL '3 minutes')
         OR (job_type = 'provision_managed_runtime' AND locked_at < NOW() - INTERVAL '10 minutes')
         OR (job_type NOT IN ('gateway_chat_completion', 'provision_managed_runtime')
             AND locked_at < NOW() - INTERVAL '5 minutes')
       )`
  );
}

async function processGatewayChatJob(job: PlatformJobRow) {
  const payload = job.payload as unknown as QueueChatPayload;
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  if (!gatewayToken) {
    // Configuration errors don't resolve themselves between retries — fail
    // permanently so we don't burn the 3-attempt budget on a guaranteed
    // failure.
    throw new PermanentJobError('OPENCLAW_GATEWAY_TOKEN is not configured on backend');
  }

  // M-10: Validate the gateway URL shape before retrying. A malformed URL
  // would otherwise burn all 3 attempts on something we know up-front cannot
  // succeed. We allow only https URLs with a non-empty host.
  let gatewayBase: string;
  try {
    const parsed = new URL(payload.gatewayUrl);
    if (parsed.protocol !== 'https:' || !parsed.host) {
      throw new Error(`unsupported gatewayUrl protocol/host: ${payload.gatewayUrl}`);
    }
    gatewayBase = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}`;
  } catch (urlErr: unknown) {
    const msg = urlErr instanceof Error ? urlErr.message : String(urlErr);
    // Fail fast — don't waste retry budget on garbage input. We intentionally
    // throw so the job is marked failed by the outer retry handler with a
    // clear error rather than burning attempts.
    throw new PermanentJobError(
      `Gateway URL invalid (${msg}); job will not be retried`
    );
  }

  // Validate gateway URL — must be public HTTPS, not internal/metadata hosts
  const gatewayUrl = payload.gatewayUrl?.replace(/\/\/$/, '');
  if (!gatewayUrl) {
    throw new Error('Gateway URL is missing from payload');
  }
  let parsed: URL;
  try {
    parsed = new URL(gatewayUrl);
  } catch {
    throw new Error(`Invalid gateway URL: ${gatewayUrl}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`Gateway URL must be HTTPS, got: ${parsed.protocol}`);
  }
  const hostname = parsed.hostname;
  const PRIVATE_IP = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|0\.|localhost|\[::1\]|169\.254\.)/;
  if (PRIVATE_IP.test(hostname) || hostname === 'metadata.google.internal') {
    throw new Error(`Gateway URL resolves to internal host: ${hostname}`);
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (payload.systemPrompt?.trim()) {
    messages.push({ role: 'system', content: payload.systemPrompt.trim() });
  }
  messages.push({ role: 'user', content: payload.message });

  const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gatewayToken}`,
    },
    body: JSON.stringify({
      model: 'openclaw/default',
      messages,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gateway chat failed (${response.status}): ${text || response.statusText}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const reply = (data?.choices as Array<Record<string, unknown>> | undefined)?.[0]?.message
    ? String((((data.choices as Array<Record<string, unknown>>)[0].message as Record<string, unknown>)?.content) || '')
    : String((data?.reply as string | undefined) || '');

  await completeJob(job.id, {
    agentId: payload.agentId,
    gatewayUrl: payload.gatewayUrl,
    reply: reply || 'No response',
    usage: data?.usage || null,
    model: data?.model || 'openclaw/default',
  });
}

export async function processPlatformJobs(maxJobs = 2): Promise<void> {
  await requeueStaleRunningJobs();

  for (let i = 0; i < maxJobs; i += 1) {
    const job = await claimNextJob();
    if (!job) {
      return;
    }

    try {
      switch (job.job_type) {
        case 'provision_managed_runtime':
          await processProvisionJob(job);
          break;
        case 'gateway_chat_completion':
          await processGatewayChatJob(job);
          break;
        default:
          // Unknown job_type is permanent: another build/version of the
          // worker has to ship before we can process it, so retrying
          // helps no one.
          await failJob(job, `Unsupported job type: ${job.job_type}`, true);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown platform job error';
      const permanent = error instanceof PermanentJobError;
      log.error(
        `[PlatformJobs] Job failed${permanent ? ' (permanent)' : ''}:`,
        { jobId: job.id, error: message }
      );
      await failJob(job, message, permanent);
    }
  }
}
