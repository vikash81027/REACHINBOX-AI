import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { isAuthenticated } from '../middleware/auth';
import { scheduleEmail, scheduleBulkEmails } from '../services/scheduler';

const router = Router();

// Validation schemas
const scheduleEmailSchema = z.object({
    senderId: z.string().uuid(),
    toEmail: z.string().email(),
    subject: z.string().min(1).max(500),
    body: z.string().min(1),
    scheduledAt: z.string().datetime(),
});

const scheduleBulkSchema = z.object({
    senderId: z.string().uuid(),
    emails: z.array(z.string().email()).min(1).max(10000),
    subject: z.string().min(1).max(500),
    body: z.string().min(1),
    startTime: z.string().datetime(),
    delayBetweenEmails: z.number().min(1000).max(3600000), // 1 second to 1 hour
    hourlyLimit: z.number().min(1).max(1000).optional(),
});

// Schedule a single email
router.post('/schedule', isAuthenticated, async (req, res) => {
    try {
        const data = scheduleEmailSchema.parse(req.body);

        const emailId = await scheduleEmail({
            userId: req.user!.id,
            senderId: data.senderId,
            toEmail: data.toEmail,
            subject: data.subject,
            body: data.body,
            scheduledAt: new Date(data.scheduledAt),
        });

        res.status(201).json({
            success: true,
            emailId,
            message: 'Email scheduled successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('Schedule email error:', error);
        res.status(500).json({ error: 'Failed to schedule email' });
    }
});

// Schedule multiple emails (bulk)
router.post('/schedule/bulk', isAuthenticated, async (req, res) => {
    try {
        const data = scheduleBulkSchema.parse(req.body);

        const emailIds = await scheduleBulkEmails({
            userId: req.user!.id,
            senderId: data.senderId,
            emails: data.emails,
            subject: data.subject,
            body: data.body,
            startTime: new Date(data.startTime),
            delayBetweenEmails: data.delayBetweenEmails,
        });

        res.status(201).json({
            success: true,
            emailIds,
            count: emailIds.length,
            message: `${emailIds.length} emails scheduled successfully`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('Bulk schedule error:', error);
        res.status(500).json({ error: 'Failed to schedule emails' });
    }
});

// Get scheduled emails
router.get('/scheduled', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = (page - 1) * limit;

        const [emails, total] = await Promise.all([
            prisma.email.findMany({
                where: {
                    userId: req.user!.id,
                    status: { in: ['SCHEDULED', 'RATE_LIMITED'] },
                },
                include: {
                    sender: {
                        select: { email: true, name: true },
                    },
                },
                orderBy: { scheduledAt: 'asc' },
                skip: offset,
                take: limit,
            }),
            prisma.email.count({
                where: {
                    userId: req.user!.id,
                    status: { in: ['SCHEDULED', 'RATE_LIMITED'] },
                },
            }),
        ]);

        res.json({
            emails,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get scheduled emails error:', error);
        res.status(500).json({ error: 'Failed to get scheduled emails' });
    }
});

// Get sent emails
router.get('/sent', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = (page - 1) * limit;

        const [emails, total] = await Promise.all([
            prisma.email.findMany({
                where: {
                    userId: req.user!.id,
                    status: { in: ['SENT', 'FAILED'] },
                },
                include: {
                    sender: {
                        select: { email: true, name: true },
                    },
                },
                orderBy: { sentAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            prisma.email.count({
                where: {
                    userId: req.user!.id,
                    status: { in: ['SENT', 'FAILED'] },
                },
            }),
        ]);

        res.json({
            emails,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get sent emails error:', error);
        res.status(500).json({ error: 'Failed to get sent emails' });
    }
});

// Get email by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const email = await prisma.email.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
            },
            include: {
                sender: {
                    select: { email: true, name: true },
                },
            },
        });

        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }

        res.json(email);
    } catch (error) {
        console.error('Get email error:', error);
        res.status(500).json({ error: 'Failed to get email' });
    }
});

// Cancel a scheduled email
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const email = await prisma.email.findFirst({
            where: {
                id: req.params.id,
                userId: req.user!.id,
                status: { in: ['SCHEDULED', 'RATE_LIMITED'] },
            },
        });

        if (!email) {
            return res.status(404).json({ error: 'Scheduled email not found' });
        }

        // Remove from queue if job exists
        if (email.bullJobId) {
            const { emailQueue } = await import('../queues/emailQueue');
            const job = await emailQueue.getJob(email.bullJobId);
            if (job) {
                await job.remove();
            }
        }

        // Delete from database
        await prisma.email.delete({
            where: { id: email.id },
        });

        res.json({ success: true, message: 'Email cancelled successfully' });
    } catch (error) {
        console.error('Cancel email error:', error);
        res.status(500).json({ error: 'Failed to cancel email' });
    }
});

export default router;
