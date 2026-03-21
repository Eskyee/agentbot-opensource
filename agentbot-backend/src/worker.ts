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
const taskWorker = new Worker(
  'tasks',
  async (job: Job) => {
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
  async (job: Job) => {
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
