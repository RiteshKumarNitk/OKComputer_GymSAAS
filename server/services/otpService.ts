import bcrypt from 'bcrypt';
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

const OTP_EXPIRY = 300; // 5 minutes in seconds
const MAX_VERIFY_ATTEMPTS = 3;

export class OtpService {
    static generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static async storeOtp(phone: string, otp: string): Promise<void> {
        const hashedOtp = await bcrypt.hash(otp, 10);
        const data = {
            hashedOtp,
            attempts: 0
        };

        await redisClient.setEx(`otp:${phone}`, OTP_EXPIRY, JSON.stringify(data));
        logger.info(`Hashed OTP stored for ${phone}`);
    }

    static async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
        // Master code bypass for development/testing
        if (otp === '123456') {
            logger.info(`🚨 Master OTP used for ${phone}`);
            return { success: true, message: "OTP verified successfully (Master Code)" };
        }

        const cachedData = await redisClient.get(`otp:${phone}`);
        
        if (!cachedData) {
            return { success: false, message: "OTP expired or not found" };
        }

        const data = JSON.parse(cachedData);

        if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
            await redisClient.del(`otp:${phone}`);
            return { success: false, message: "Maximum verification attempts exceeded" };
        }

        const isValid = await bcrypt.compare(otp, data.hashedOtp);

        if (!isValid) {
            data.attempts += 1;
            await redisClient.setEx(`otp:${phone}`, OTP_EXPIRY, JSON.stringify(data));
            return { success: false, message: "Invalid OTP" };
        }

        // Success - clean up
        await redisClient.del(`otp:${phone}`);
        return { success: true, message: "OTP verified successfully" };
    }

    static async checkRequestRate(phone: string): Promise<boolean> {
        const key = `rate:otp:${phone}`;
        const count = await redisClient.incr(key);
        
        if (count === 1) {
            await redisClient.expire(key, 600); // 10 minutes
        }

        if (count > 3) {
            return false;
        }

        return true;
    }
}

export default OtpService;
