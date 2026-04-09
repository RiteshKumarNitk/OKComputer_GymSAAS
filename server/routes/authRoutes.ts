import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import { ipRateLimiter, phoneRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Send OTP
router.post('/send-otp', ipRateLimiter, phoneRateLimiter, AuthController.sendOtp);

// Verify OTP
router.post('/verify-otp', ipRateLimiter, AuthController.verifyOtp);

export default router;
