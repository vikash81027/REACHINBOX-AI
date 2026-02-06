import Redis from 'ioredis';
import { config } from '../config';

/**
 * Redis-backed rate limiter for email sending
 * Uses atomic operations to ensure thread-safety across multiple workers
 */
export class RateLimiter {
    private redis: Redis;
    private maxPerHour: number;

    constructor(redis: Redis) {
        this.redis = redis;
        this.maxPerHour = config.maxEmailsPerHourPerSender;
    }

    /**
     * Get the current hour window key
     * Format: YYYY-MM-DD-HH
     */
    private getHourWindow(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        return `${year}-${month}-${day}-${hour}`;
    }

    /**
     * Get the Redis key for rate limiting
     */
    private getKey(senderId: string, hourWindow: string): string {
        return `rate_limit:${senderId}:${hourWindow}`;
    }

    /**
     * Check if sender can send an email (under rate limit)
     * Uses atomic INCR to prevent race conditions
     */
    async checkAndIncrement(senderId: string): Promise<{
        allowed: boolean;
        currentCount: number;
        limit: number;
        retryAfterMs?: number;
    }> {
        const hourWindow = this.getHourWindow();
        const key = this.getKey(senderId, hourWindow);

        // Atomic increment with expiry
        const multi = this.redis.multi();
        multi.incr(key);
        multi.expire(key, 3600); // 1 hour TTL
        const results = await multi.exec();

        if (!results) {
            throw new Error('Redis transaction failed');
        }

        const currentCount = results[0][1] as number;

        if (currentCount > this.maxPerHour) {
            // Decrement since we already incremented
            await this.redis.decr(key);

            // Calculate time until next hour window
            const now = new Date();
            const nextHour = new Date(now);
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            const retryAfterMs = nextHour.getTime() - now.getTime();

            return {
                allowed: false,
                currentCount: currentCount - 1,
                limit: this.maxPerHour,
                retryAfterMs,
            };
        }

        return {
            allowed: true,
            currentCount,
            limit: this.maxPerHour,
        };
    }

    /**
     * Get current count for a sender in the current hour
     */
    async getCurrentCount(senderId: string): Promise<number> {
        const hourWindow = this.getHourWindow();
        const key = this.getKey(senderId, hourWindow);
        const count = await this.redis.get(key);
        return count ? parseInt(count, 10) : 0;
    }

    /**
     * Get remaining quota for a sender
     */
    async getRemainingQuota(senderId: string): Promise<number> {
        const currentCount = await this.getCurrentCount(senderId);
        return Math.max(0, this.maxPerHour - currentCount);
    }

    /**
     * Calculate the next available time slot when rate limited
     */
    getNextAvailableSlot(): Date {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        return nextHour;
    }
}

export default RateLimiter;
