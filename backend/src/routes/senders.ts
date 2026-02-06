import { Router } from 'express';
import prisma from '../config/database';
import { isAuthenticated } from '../middleware/auth';
import { createEtherealAccount } from '../services/emailService';

const router = Router();

// Get all senders
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const senders = await prisma.sender.findMany({
            where: { isActive: true },
            select: {
                id: true,
                email: true,
                name: true,
                hourlyLimit: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ senders });
    } catch (error) {
        console.error('Get senders error:', error);
        res.status(500).json({ error: 'Failed to get senders' });
    }
});

// Create a new sender with Ethereal account
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Create Ethereal test account
        const etherealAccount = await createEtherealAccount();

        const sender = await prisma.sender.create({
            data: {
                email: etherealAccount.email,
                name,
                etherealUser: etherealAccount.user,
                etherealPass: etherealAccount.pass,
                hourlyLimit: 100,
            },
        });

        res.status(201).json({
            id: sender.id,
            email: sender.email,
            name: sender.name,
            hourlyLimit: sender.hourlyLimit,
            message: 'Sender created with Ethereal account',
        });
    } catch (error) {
        console.error('Create sender error:', error);
        res.status(500).json({ error: 'Failed to create sender' });
    }
});

// Get sender by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const sender = await prisma.sender.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                name: true,
                hourlyLimit: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!sender) {
            return res.status(404).json({ error: 'Sender not found' });
        }

        res.json(sender);
    } catch (error) {
        console.error('Get sender error:', error);
        res.status(500).json({ error: 'Failed to get sender' });
    }
});

// Update sender
router.patch('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, hourlyLimit, isActive } = req.body;

        const sender = await prisma.sender.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(hourlyLimit && { hourlyLimit }),
                ...(isActive !== undefined && { isActive }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                hourlyLimit: true,
                isActive: true,
            },
        });

        res.json(sender);
    } catch (error) {
        console.error('Update sender error:', error);
        res.status(500).json({ error: 'Failed to update sender' });
    }
});

// Delete sender
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        // Check if sender has pending emails
        const pendingCount = await prisma.email.count({
            where: {
                senderId: req.params.id,
                status: { in: ['SCHEDULED', 'RATE_LIMITED', 'PROCESSING'] },
            },
        });

        if (pendingCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete sender with pending emails',
                pendingCount,
            });
        }

        await prisma.sender.delete({
            where: { id: req.params.id },
        });

        res.json({ success: true, message: 'Sender deleted successfully' });
    } catch (error) {
        console.error('Delete sender error:', error);
        res.status(500).json({ error: 'Failed to delete sender' });
    }
});

export default router;
