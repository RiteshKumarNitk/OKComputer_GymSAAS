import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

export const ipRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.get('x-forwarded-for') || 'unknown';
    const key = `rate:ip:${ip}`;

    try {
        const count = await redisClient.incr(key);
        if (count === 1) {
            await redisClient.expire(key, 60); // 1 minute window for IP
        }

        if (count > 20) { // Max 20 requests per minute per IP
            logger.warn(`Rate limit exceeded for IP: ${ip}`);
            return res.status(429).json({ error: "Too many requests. Please try again later." });
        }

        next();
    } catch (err) {
        logger.error('Rate limiter error:', err);
        next(); // Fallback to allow request if Redis fails
    }
};

export const phoneRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const { phone } = req.body;
    if (!phone) return next();

    const key = `rate:otp:phone:${phone}`;

    try {
        const count = await redisClient.incr(key);
        if (count === 1) {
            await redisClient.expire(key, 600); // 10 minutes window
        }

        if (count > 3) {
            logger.warn(`OTP rate limit exceeded for phone: ${phone}`);
            return res.status(429).json({ error: "Too many OTP requests. Please wait 10 minutes." });
        }

        next();
    } catch (err) {
        logger.error('Phone rate limiter error:', err);
        next();
    }
};
