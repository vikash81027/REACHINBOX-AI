import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

export interface EmailJobData {
    emailId: string;
    toEmail: string;
    subject: string;
    body: string;
    senderId: string;
    senderEmail: string;
    etherealUser: string;
    etherealPass: string;
}

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: {
            count: 1000,
            age: 24 * 3600, // Keep completed jobs for 24 hours
        },
        removeOnFail: {
            count: 5000,
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
});

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
    connection: redis,
});

emailQueue.on('error', (err) => {
    console.error('Email queue error:', err);
});

console.log('📧 Email queue initialized');

export default emailQueue;
