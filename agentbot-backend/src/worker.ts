import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Define queues
export const taskQueue = new Queue('tasks', { connection });
export const provisionQueue = new Queue('provision', { connection });

// Task processor
const taskWorker = new Worker(
  'tasks',
  async (job: { name: string; id: string | undefined; data: Record<string, unknown> }) => {
    console.log(`[Worker] Processing task: ${job.name}`, { jobId: job.id, data: job.data });

    switch (job.name) {
      case 'scheduled-task':
        console.log(`[Worker] Running scheduled task: ${job.data.taskId}`);
        break;
      case 'skill-execution':
        console.log(`[Worker] Executing skill: ${job.data.skillName}`);
        break;
      default:
        console.log(`[Worker] Unknown task type: ${job.name}`);
    }

    return { completed: true, timestamp: new Date().toISOString() };
  },
  { connection, concurrency: 5 }
);

// Provision processor
const provisionWorker = new Worker(
  'provision',
  async (job: { name: string; id: string | undefined; data: Record<string, unknown> }) => {
    console.log(`[Worker] Processing provision: ${job.name}`, { jobId: job.id, data: job.data });

    switch (job.name) {
      case 'new-agent':
        console.log(`[Worker] Provisioning new agent for user: ${job.data.userId}`);
        break;
      default:
        console.log(`[Worker] Unknown provision type: ${job.name}`);
    }

    return { completed: true, timestamp: new Date().toISOString() };
  },
  { connection, concurrency: 2 }
);

taskWorker.on('completed', (job) => {
  console.log(`[Worker] Task completed: ${job.name}`, { jobId: job.id });
});

taskWorker.on('failed', (job, err: Error) => {
  console.error(`[Worker] Task failed: ${job?.name}`, { jobId: job?.id, error: err.message });
});

provisionWorker.on('completed', (job) => {
  console.log(`[Worker] Provision completed: ${job.name}`, { jobId: job.id });
});

provisionWorker.on('failed', (job, err: Error) => {
  console.error(`[Worker] Provision failed: ${job?.name}`, { jobId: job?.id, error: err.message });
});

console.log('[Worker] Started. Listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await taskWorker.close();
  await provisionWorker.close();
  await connection.quit();
  process.exit(0);
});
