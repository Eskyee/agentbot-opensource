import { Worker, Queue, Job } from 'bullmq';
import { config } from 'dotenv';

config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// BullMQ accepts a connection options object directly
const connection = { url: REDIS_URL };

// Define queues
export const taskQueue = new Queue('tasks', { connection });
export const provisionQueue = new Queue('provision', { connection });

// Task processor
// TODO: These handlers are STUBS — they log and return success without doing real work.
// Jobs queued here will silently "succeed" without executing any business logic.
// Each case must be implemented before this worker is used in production.
const taskWorker = new Worker(
  'tasks',
  async (job: Job) => {
    console.warn(`[Worker] STUB handler invoked for task: ${job.name} (jobId: ${job.id}) — no business logic implemented`);

    switch (job.name) {
      case 'scheduled-task':
        // TODO: Implement scheduled task execution using job.data.taskId
        console.warn(`[Worker] STUB: scheduled-task ${job.data.taskId} — not implemented`);
        throw new Error(`scheduled-task handler not yet implemented (taskId: ${job.data.taskId})`);
      case 'skill-execution':
        // TODO: Implement skill execution using job.data.skillName
        console.warn(`[Worker] STUB: skill-execution ${job.data.skillName} — not implemented`);
        throw new Error(`skill-execution handler not yet implemented (skill: ${job.data.skillName})`);
      default:
        throw new Error(`Unknown task type: ${job.name}`);
    }
  },
  { connection, concurrency: 5 }
);

// Provision processor
// TODO: These handlers are STUBS — they log and return success without doing real work.
const provisionWorker = new Worker(
  'provision',
  async (job: Job) => {
    console.warn(`[Worker] STUB handler invoked for provision: ${job.name} (jobId: ${job.id}) — no business logic implemented`);

    switch (job.name) {
      case 'new-agent':
        // TODO: Implement agent provisioning logic using job.data.userId
        console.warn(`[Worker] STUB: new-agent for user ${job.data.userId} — not implemented`);
        throw new Error(`new-agent handler not yet implemented (userId: ${job.data.userId})`);
      default:
        throw new Error(`Unknown provision type: ${job.name}`);
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
