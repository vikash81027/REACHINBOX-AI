import { Router } from 'express';
import prisma from '../config/database';
import { z } from 'zod';

const router = Router();

// Sync user from frontend OAuth
const syncUserSchema = z.object({
    googleId: z.string(),
    email: z.string().email(),
    name: z.string(),
    avatar: z.string().optional(),
});

router.post('/sync', async (req, res) => {
    try {
        const data = syncUserSchema.parse(req.body);

        // Upsert user
        const user = await prisma.user.upsert({
            where: { googleId: data.googleId },
            update: {
                email: data.email,
                name: data.name,
                avatar: data.avatar,
            },
            create: {
                googleId: data.googleId,
                email: data.email,
                name: data.name,
                avatar: data.avatar,
            },
        });

        res.json({ success: true, userId: user.id });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid data', details: error.errors });
        }
        console.error('Sync user error:', error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});

export default router;
