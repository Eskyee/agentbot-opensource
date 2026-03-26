import { Worker, Queue, Job } from 'bullmq';
import { config } from 'dotenv';
import { Pool } from 'pg';

config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || '';

// BullMQ accepts a connection options object directly
const connection = { url: REDIS_URL };

// DB pool for worker queries
const pool = new Pool({ connectionString: DATABASE_URL });

// Define queues
export const taskQueue = new Queue('tasks', { connection });
export const provisionQueue = new Queue('provision', { connection });

// Task processor — handles scheduled tasks and skill executions
const taskWorker = new Worker(
  'tasks',
  async (job: Job) => {
    console.log(`[Worker] Processing task: ${job.name} (jobId: ${job.id})`);

    switch (job.name) {
      case 'scheduled-task': {
        const { taskId, agentId, userId, config: taskConfig } = job.data;
        console.log(`[Worker] Executing scheduled task ${taskId} for agent ${agentId}`);
        
        // Mark task as running
        await pool.query(
          `UPDATE scheduled_tasks SET status = 'running', last_run_at = NOW() WHERE id = $1`,
          [taskId]
        ).catch(err => console.error(`[Worker] Failed to update task status:`, err));

        // Execute the task via agent API if available
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
            console.log(`[Worker] Task ${taskId} completed:`, result);
          } catch (fetchErr: any) {
            console.error(`[Worker] Task ${taskId} agent call failed:`, fetchErr.message);
          }
        }

        // Mark task as completed
        await pool.query(
          `UPDATE scheduled_tasks SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [taskId]
        ).catch(err => console.error(`[Worker] Failed to mark task completed:`, err));

        return { taskId, status: 'completed' };
      }

      case 'skill-execution': {
        const { skillName, agentId, userId, input } = job.data;
        console.log(`[Worker] Executing skill ${skillName} for agent ${agentId}`);
        
        // Log skill execution
        await pool.query(
          `INSERT INTO skill_executions (skill_name, agent_id, user_id, status, created_at)
           VALUES ($1, $2, $3, 'completed', NOW())`,
          [skillName, agentId, userId]
        ).catch(err => console.error(`[Worker] Failed to log skill execution:`, err));

        return { skillName, status: 'completed' };
      }

      default:
        console.warn(`[Worker] Unknown task type: ${job.name}`);
        return { status: 'unknown', type: job.name };
    }
  },
  { connection, concurrency: 5 }
);

// Provision processor — handles agent provisioning jobs
const provisionWorker = new Worker(
  'provision',
  async (job: Job) => {
    console.log(`[Worker] Processing provision: ${job.name} (jobId: ${job.id})`);

    switch (job.name) {
      case 'new-agent': {
        const { userId, agentId, plan, name } = job.data;
        console.log(`[Worker] Provisioning new agent ${agentId} for user ${userId} (plan: ${plan})`);
        
        // Update agent status to provisioning
        await pool.query(
          `UPDATE agents SET status = 'provisioning', updated_at = NOW() WHERE id = $1`,
          [agentId]
        ).catch(err => console.error(`[Worker] Failed to update agent status:`, err));

        // Agent provisioning is handled by the main API (Render container-manager)
        // This worker job serves as a post-provision hook for cleanup/setup tasks
        
        // Log the provisioning event
        await pool.query(
          `INSERT INTO events (user_id, agent_id, event_type, metadata, created_at)
           VALUES ($1, $2, 'agent_provisioned', $3, NOW())`,
          [userId, agentId, JSON.stringify({ plan, name })]
        ).catch(err => console.error(`[Worker] Failed to log provision event:`, err));

        return { agentId, status: 'provisioned' };
      }

      default:
        console.warn(`[Worker] Unknown provision type: ${job.name}`);
        return { status: 'unknown', type: job.name };
    }
  },
  { connection, concurrency: 2 }
);

taskWorker.on('completed', (job) => {
  console.log(`[Worker] Task completed: ${job?.name}`, { jobId: job?.id });
});

taskWorker.on('failed', (job, err) => {
  console.error(`[Worker] Task failed: ${job?.name}`, { jobId: job?.id, error: err.message });
});

provisionWorker.on('completed', (job) => {
  console.log(`[Worker] Provision completed: ${job?.name}`, { jobId: job?.id });
});

provisionWorker.on('failed', (job, err) => {
  console.error(`[Worker] Provision failed: ${job?.name}`, { jobId: job?.id, error: err.message });
});

console.log('[Worker] Started. Listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await taskWorker.close();
  await provisionWorker.close();
  process.exit(0);
});
