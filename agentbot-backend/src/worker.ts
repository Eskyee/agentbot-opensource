import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './lib/config';
import { logger } from './lib/logger';

const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Define queues
export const taskQueue = new Queue('tasks', { connection });
export const provisionQueue = new Queue('provision', { connection });

// Task processor
const taskWorker = new Worker(
  'tasks',
  async (job) => {
    logger.info(`Processing task: ${job.name}`, { jobId: job.id, data: job.data });

    switch (job.name) {
      case 'scheduled-task':
        // Execute scheduled agent task
        logger.info(`Running scheduled task: ${job.data.taskId}`);
        break;
      case 'skill-execution':
        // Execute skill
        logger.info(`Executing skill: ${job.data.skillName}`);
        break;
      default:
        logger.warn(`Unknown task type: ${job.name}`);
    }

    return { completed: true, timestamp: new Date().toISOString() };
  },
  { connection, concurrency: 5 }
);

// Provision processor
const provisionWorker = new Worker(
  'provision',
  async (job) => {
    logger.info(`Processing provision: ${job.name}`, { jobId: job.id, data: job.data });

    switch (job.name) {
      case 'new-agent':
        logger.info(`Provisioning new agent for user: ${job.data.userId}`);
        break;
      default:
        logger.warn(`Unknown provision type: ${job.name}`);
    }

    return { completed: true, timestamp: new Date().toISOString() };
  },
  { connection, concurrency: 2 }
);

taskWorker.on('completed', (job) => {
  logger.info(`Task completed: ${job.name}`, { jobId: job.id });
});

taskWorker.on('failed', (job, err) => {
  logger.error(`Task failed: ${job?.name}`, { jobId: job?.id, error: err.message });
});

provisionWorker.on('completed', (job) => {
  logger.info(`Provision completed: ${job.name}`, { jobId: job.id });
});

provisionWorker.on('failed', (job, err) => {
  logger.error(`Provision failed: ${job?.name}`, { jobId: job?.id, error: err.message });
});

logger.info('Worker started. Listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await taskWorker.close();
  await provisionWorker.close();
  await connection.quit();
  process.exit(0);
});
