import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const notificationQueue = new Queue('notificationQueue', { connection });
export const summaryQueue = new Queue('summaryQueue', { connection });

// Scheduler to handle stalled jobs
new QueueScheduler('notificationQueue', { connection });
new QueueScheduler('summaryQueue', { connection });

// Worker registration happens in /workers/*.ts
