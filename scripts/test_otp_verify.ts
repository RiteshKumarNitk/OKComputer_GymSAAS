import OtpService from './server/services/otpService.js';
import redisClient from './server/config/redis.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function testOtpFlow() {
    const testPhone = "919999999999";
    
    console.log("--- Starting OTP Test Flow ---");

    // 1. Generate OTP
    const otp = OtpService.generateOtp();
    console.log(`1. Generated OTP: ${otp}`);

    // 2. Store OTP
    await OtpService.storeOtp(testPhone, otp);
    console.log("2. OTP stored in Redis (hashed)");

    // 3. Check Redis content
    const cached = await redisClient.get(`otp:${testPhone}`);
    console.log("3. Redis Cache Data:", cached);

    // 4. Verify Correct OTP
    console.log("4. Verifying correct OTP...");
    const verifySuccess = await OtpService.verifyOtp(testPhone, otp);
    console.log("Result:", verifySuccess);

    // 5. Verify Already Deleted (One-time use)
    console.log("5. Verifying already deleted OTP...");
    const verifyDeleted = await OtpService.verifyOtp(testPhone, otp);
    console.log("Result (should fail):", verifyDeleted);

    // 6. Test Rate Limiting
    console.log("6. Testing Rate Limiting (3 per 10 mins)...");
    for (let i = 0; i < 5; i++) {
        const allowed = await OtpService.checkRequestRate(testPhone);
        console.log(`Attempt ${i+1}: ${allowed ? "Allowed" : "Blocked"}`);
    }

    // Clean up rate limit key for future tests
    await redisClient.del(`rate:otp:${testPhone}`);
    
    console.log("--- Test Flow Completed ---");
    process.exit(0);
}

testOtpFlow().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
