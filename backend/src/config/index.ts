import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL || '',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // Session
    sessionSecret: process.env.SESSION_SECRET || 'development-secret',

    // Google OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

    // Ethereal Email
    etherealUser: process.env.ETHEREAL_USER || '',
    etherealPass: process.env.ETHEREAL_PASS || '',

    // Rate Limiting
    maxEmailsPerHourPerSender: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '100', 10),
    minDelayBetweenSendsMs: parseInt(process.env.MIN_DELAY_BETWEEN_SENDS_MS || '2000', 10),
    workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),

    // URLs
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
};

export function validateConfig() {
    const required = [
        'databaseUrl',
        'sessionSecret',
        'googleClientId',
        'googleClientSecret',
    ] as const;

    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        console.warn(`Warning: Missing required config: ${missing.join(', ')}`);
    }
}
