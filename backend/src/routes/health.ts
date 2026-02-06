import { Router } from 'express';
import { emailQueue } from '../queues/emailQueue';
import prisma from '../config/database';
import { redis } from '../config/redis';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        // Check Redis connection
        await redis.ping();

        // Get queue stats
        const waiting = await emailQueue.getWaitingCount();
        const active = await emailQueue.getActiveCount();
        const delayed = await emailQueue.getDelayedCount();
        const completed = await emailQueue.getCompletedCount();
        const failed = await emailQueue.getFailedCount();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: 'connected',
                queue: {
                    waiting,
                    active,
                    delayed,
                    completed,
                    failed,
                },
            },
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Get queue statistics
router.get('/stats', async (req, res) => {
    try {
        const [
            scheduledCount,
            sentCount,
            failedCount,
            queueWaiting,
            queueActive,
            queueDelayed,
        ] = await Promise.all([
            prisma.email.count({ where: { status: 'SCHEDULED' } }),
            prisma.email.count({ where: { status: 'SENT' } }),
            prisma.email.count({ where: { status: 'FAILED' } }),
            emailQueue.getWaitingCount(),
            emailQueue.getActiveCount(),
            emailQueue.getDelayedCount(),
        ]);

        res.json({
            database: {
                scheduled: scheduledCount,
                sent: sentCount,
                failed: failedCount,
            },
            queue: {
                waiting: queueWaiting,
                active: queueActive,
                delayed: queueDelayed,
            },
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

export default router;
