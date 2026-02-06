import prisma from '../config/database';
import { emailQueue, EmailJobData } from '../queues/emailQueue';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleEmailParams {
    userId: string;
    senderId: string;
    toEmail: string;
    subject: string;
    body: string;
    scheduledAt: Date;
}

export interface BulkScheduleParams {
    userId: string;
    senderId: string;
    emails: string[];
    subject: string;
    body: string;
    startTime: Date;
    delayBetweenEmails: number; // in milliseconds
}

/**
 * Schedule a single email
 */
export async function scheduleEmail(params: ScheduleEmailParams): Promise<string> {
    const { userId, senderId, toEmail, subject, body, scheduledAt } = params;

    // Get sender info
    const sender = await prisma.sender.findUnique({
        where: { id: senderId },
    });

    if (!sender) {
        throw new Error('Sender not found');
    }

    // Create email record in database
    const emailId = uuidv4();
    const bullJobId = `email-${emailId}`;

    await prisma.email.create({
        data: {
            id: emailId,
            userId,
            senderId,
            toEmail,
            subject,
            body,
            scheduledAt,
            status: 'SCHEDULED',
            bullJobId,
        },
    });

    // Calculate delay from now
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());

    // Create BullMQ job
    const jobData: EmailJobData = {
        emailId,
        toEmail,
        subject,
        body,
        senderId,
        senderEmail: sender.email,
        etherealUser: sender.etherealUser,
        etherealPass: sender.etherealPass,
    };

    await emailQueue.add('send-email', jobData, {
        delay: delayMs,
        jobId: bullJobId,
    });

    console.log(`📅 Scheduled email ${emailId} for ${scheduledAt.toISOString()}`);

    return emailId;
}

/**
 * Schedule multiple emails with staggered timing
 */
export async function scheduleBulkEmails(params: BulkScheduleParams): Promise<string[]> {
    const { userId, senderId, emails, subject, body, startTime, delayBetweenEmails } = params;

    const emailIds: string[] = [];
    let currentTime = startTime.getTime();

    for (const toEmail of emails) {
        const scheduledAt = new Date(currentTime);
        const emailId = await scheduleEmail({
            userId,
            senderId,
            toEmail,
            subject,
            body,
            scheduledAt,
        });
        emailIds.push(emailId);
        currentTime += delayBetweenEmails;
    }

    console.log(`📅 Scheduled ${emailIds.length} emails starting at ${startTime.toISOString()}`);

    return emailIds;
}

/**
 * Sync pending emails with BullMQ on server startup
 * This ensures emails scheduled before a restart are still processed
 */
export async function syncPendingEmailsOnStartup(): Promise<void> {
    console.log('🔄 Syncing pending emails with queue...');

    // Find emails that should be scheduled but might have lost their jobs
    const pendingEmails = await prisma.email.findMany({
        where: {
            status: { in: ['SCHEDULED', 'RATE_LIMITED'] },
            scheduledAt: { gte: new Date() },
        },
        include: {
            sender: true,
        },
    });

    let recreatedCount = 0;

    for (const email of pendingEmails) {
        try {
            // Check if job exists in queue
            const existingJob = email.bullJobId
                ? await emailQueue.getJob(email.bullJobId)
                : null;

            if (!existingJob) {
                // Recreate the job
                const newJobId = `email-${email.id}-resync-${Date.now()}`;
                const delayMs = Math.max(0, email.scheduledAt.getTime() - Date.now());

                const jobData: EmailJobData = {
                    emailId: email.id,
                    toEmail: email.toEmail,
                    subject: email.subject,
                    body: email.body,
                    senderId: email.senderId,
                    senderEmail: email.sender.email,
                    etherealUser: email.sender.etherealUser,
                    etherealPass: email.sender.etherealPass,
                };

                await emailQueue.add('send-email', jobData, {
                    delay: delayMs,
                    jobId: newJobId,
                });

                // Update email with new job ID
                await prisma.email.update({
                    where: { id: email.id },
                    data: { bullJobId: newJobId },
                });

                recreatedCount++;
                console.log(`📧 Recreated job for email ${email.id}`);
            }
        } catch (error) {
            console.error(`Failed to sync email ${email.id}:`, error);
        }
    }

    // Mark any PROCESSING emails as FAILED (server crashed mid-send)
    const stuckEmails = await prisma.email.updateMany({
        where: { status: 'PROCESSING' },
        data: {
            status: 'FAILED',
            errorMessage: 'Server restarted during processing',
        },
    });

    console.log(`✅ Sync complete: ${recreatedCount} jobs recreated, ${stuckEmails.count} stuck emails marked as failed`);
}

export default { scheduleEmail, scheduleBulkEmails, syncPendingEmailsOnStartup };
