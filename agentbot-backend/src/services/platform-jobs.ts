import { randomBytes } from 'crypto';
import { Pool } from 'pg';
import { provisionOnRailway } from '../routes/railway-provision';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

  await pool.query(
    `UPDATE "User"
     SET "openclawUrl" = $2,
         "openclawInstanceId" = $3
     WHERE "id" = $1`,
    [params.userId, managedAgentUrl, params.agentId]
  );

  await pool.query(
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
}

function makeJobId(): string {
  return `job_${randomBytes(8).toString('hex')}`;
}

function sanitizeJob(row: PlatformJobRow) {
  const payload = row.payload || {};
  const safePayload = {
    userId: typeof payload.userId === 'string' ? payload.userId : row.user_id,
    agentId: typeof payload.agentId === 'string' ? payload.agentId : row.agent_id,
    plan: typeof payload.plan === 'string' ? payload.plan : null,
    aiProvider: typeof payload.aiProvider === 'string' ? payload.aiProvider : null,
    agentType: typeof payload.agentType === 'string' ? payload.agentType : null,
    autoProvision: payload.autoProvision === true,
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

async function failJob(job: PlatformJobRow, errorMessage: string) {
  const shouldRetry = job.attempts < job.max_attempts;

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
  const result = await provisionOnRailway(payload.agentId, payload.plan || 'solo');

  // Non-fatal: Railway service is deployed regardless of DB persistence success.
  // A FK violation (user not found) or transient DB error must not re-queue
  // the provision job — that would re-run serviceCreate and hit "already exists".
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
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.warn(`[PlatformJobs] persistProvisionCompletion failed (non-fatal): ${msg}`);
  }

  await completeJob(job.id, {
    ...result,
    plan: payload.plan,
    aiProvider: payload.aiProvider || 'openrouter',
    agentType: payload.agentType || 'creative',
    queuedUserId: payload.userId,
    agentId: payload.agentId,
  });
}

async function requeueStaleRunningJobs(): Promise<void> {
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
       AND locked_at < NOW() - INTERVAL '10 minutes'`
  );
}

async function processGatewayChatJob(job: PlatformJobRow) {
  const payload = job.payload as unknown as QueueChatPayload;
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  if (!gatewayToken) {
    throw new Error('OPENCLAW_GATEWAY_TOKEN is not configured on backend');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (payload.systemPrompt?.trim()) {
    messages.push({ role: 'system', content: payload.systemPrompt.trim() });
  }
  messages.push({ role: 'user', content: payload.message });

  const response = await fetch(`${payload.gatewayUrl.replace(/\/$/, '')}/v1/chat/completions`, {
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
          await failJob(job, `Unsupported job type: ${job.job_type}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown platform job error';
      console.error('[PlatformJobs] Job failed:', job.id, message);
      await failJob(job, message);
    }
  }
}
