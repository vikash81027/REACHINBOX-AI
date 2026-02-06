import { Router } from 'express';
import passport from 'passport';
import { config } from '../config';

const router = Router();

// Initiate Google OAuth
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
    })
);

// Google OAuth callback
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${config.frontendUrl}/login?error=auth_failed`,
    }),
    (req, res) => {
        // Successful authentication, redirect to frontend dashboard
        res.redirect(`${config.frontendUrl}/dashboard`);
    }
);

// Get current user
router.get('/me', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        res.json({
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            avatar: req.user.avatar,
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Session destruction failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    });
});

export default router;
