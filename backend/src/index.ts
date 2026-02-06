import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { config, validateConfig } from './config';
import prisma from './config/database';
import { initializePassport } from './config/passport';
import passport from 'passport';
import { handleErrors } from './middleware/auth';
import { syncPendingEmailsOnStartup } from './services/scheduler';
import { createEmailWorker } from './queues/emailWorker';

// Routes
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import senderRoutes from './routes/senders';
import healthRoutes from './routes/health';
import syncRoutes from './routes/sync';

async function main() {
    // Validate configuration
    validateConfig();

    const app = express();

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: false, // Disable for development
    }));

    // CORS configuration
    app.use(cors({
        origin: config.frontendUrl,
        credentials: true,
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Session configuration
    app.use(session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: config.nodeEnv === 'production',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
        },
    }));

    // Initialize Passport
    initializePassport();
    app.use(passport.initialize());
    app.use(passport.session());

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/auth', syncRoutes);
    app.use('/api/emails', emailRoutes);
    app.use('/api/senders', senderRoutes);
    app.use('/api', healthRoutes);

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            name: 'ReachInbox Email Scheduler API',
            version: '1.0.0',
            status: 'running',
            docs: '/api/health',
        });
    });

    // Error handling
    app.use(handleErrors);

    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    // Sync pending emails after any server restart
    await syncPendingEmailsOnStartup();

    // Start the email worker
    const worker = createEmailWorker();

    // Start server
    const server = app.listen(config.port, () => {
        console.log(`🚀 Server running on http://localhost:${config.port}`);
        console.log(`   Environment: ${config.nodeEnv}`);
        console.log(`   Frontend URL: ${config.frontendUrl}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);

        server.close(async () => {
            console.log('HTTP server closed');

            await worker.close();
            console.log('Worker closed');

            await prisma.$disconnect();
            console.log('Database disconnected');

            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
