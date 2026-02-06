import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { config } from '../config';
import prisma from '../config/database';
import { EMAIL_QUEUE_NAME, EmailJobData, emailQueue } from './emailQueue';
import { RateLimiter } from '../services/rateLimiter';
import { sendEmail } from '../services/emailService';

const rateLimiter = new RateLimiter(redis);

/**
 * Delay helper function
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process a single email job
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { emailId, toEmail, subject, body, senderId, senderEmail, etherealUser, etherealPass } = job.data;

    console.log(`📧 Processing email job ${job.id} for ${toEmail}`);

    try {
        // Update status to PROCESSING
        await prisma.email.update({
            where: { id: emailId },
            data: { status: 'PROCESSING' },
        });

        // Check rate limit
        const rateCheck = await rateLimiter.checkAndIncrement(senderId);

        if (!rateCheck.allowed) {
            console.log(`⏳ Rate limit exceeded for sender ${senderId}. Rescheduling...`);

            // Update status to RATE_LIMITED
            await prisma.email.update({
                where: { id: emailId },
                data: { status: 'RATE_LIMITED' },
            });

            // Reschedule job for next hour window
            const delayMs = rateCheck.retryAfterMs || 3600000;
            const newScheduledTime = new Date(Date.now() + delayMs);

            const newJob = await emailQueue.add(
                'send-email',
                job.data,
                {
                    delay: delayMs,
                    jobId: `${emailId}-retry-${Date.now()}`,
                }
            );

            // Update email with new job ID and scheduled time
            await prisma.email.update({
                where: { id: emailId },
                data: {
                    bullJobId: newJob.id,
                    scheduledAt: newScheduledTime,
                    status: 'SCHEDULED',
                },
            });

            console.log(`📅 Rescheduled email ${emailId} to ${newScheduledTime.toISOString()}`);
            return;
        }

        // Add delay between sends (configurable throttling)
        await delay(config.minDelayBetweenSendsMs);

        // Send the email
        const result = await sendEmail({
            to: toEmail,
            subject,
            body,
            from: senderEmail,
            etherealUser,
            etherealPass,
        });

        if (result.success) {
            // Update email as sent
            await prisma.email.update({
                where: { id: emailId },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });
            console.log(`✅ Email ${emailId} sent successfully to ${toEmail}`);
        } else {
            throw new Error(result.error || 'Email sending failed');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to process email ${emailId}:`, errorMessage);

        // Update email as failed
        await prisma.email.update({
            where: { id: emailId },
            data: {
                status: 'FAILED',
                errorMessage,
                retryCount: { increment: 1 },
            },
        });

        throw error; // Re-throw to trigger BullMQ retry
    }
}

/**
 * Create and start the email worker
 */
export function createEmailWorker(): Worker<EmailJobData> {
    const worker = new Worker<EmailJobData>(
        EMAIL_QUEUE_NAME,
        processEmailJob,
        {
            connection: redis,
            concurrency: config.workerConcurrency,
            limiter: {
                max: 1,
                duration: config.minDelayBetweenSendsMs,
            },
        }
    );

    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    worker.on('error', (err) => {
        console.error('Worker error:', err);
    });

    console.log(`👷 Email worker started with concurrency: ${config.workerConcurrency}`);

    return worker;
}

export default createEmailWorker;
