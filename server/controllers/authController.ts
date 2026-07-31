import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import OtpService from '../services/otpService.js';
import WhatsappService from '../services/whatsappService.js';
import logger from '../config/logger.js';
import { logAudit } from '../lib/auditLog.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "gym-saas-secret-key";

export class AuthController {
    static async sendOtp(req: Request, res: Response) {
        try {
            const { phone } = req.body;
            if (!phone) {
                return res.status(400).json({ error: "Phone number is required" });
            }

            // Allow optional + prefix for validation
            if (!/^(\+)?\d{10,15}$/.test(phone)) {
                return res.status(400).json({ error: "Invalid phone number format. Enter digits or use +countrycode." });
            }

            const otp = OtpService.generateOtp();

            // LOG OTP for testing (especially useful when using hello_world template)
            logger.info(`🔑 [TEST OTP] for ${phone}: ${otp}`);

            // Try sending WhatsApp message first (don't store if send fails)
            const sent = await WhatsappService.sendOtp(phone, otp);
            if (!sent) {
                return res.status(502).json({ error: "Failed to send OTP via WhatsApp. Please try again." });
            }

            // Store hashed OTP in Redis
            await OtpService.storeOtp(phone, otp);

            res.status(200).json({ status: "success", message: "OTP sent successfully" });
        } catch (error: any) {
            logger.error('Error in sendOtp controller:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    static async verifyOtp(req: Request, res: Response) {
        try {
            const { phone, otp } = req.body;
            if (!phone || !otp) {
                return res.status(400).json({ error: "Phone and OTP are required" });
            }

            const result = await OtpService.verifyOtp(phone, otp);
            if (!result.success) {
                return res.status(401).json({ error: result.message });
            }

            // OTP verified, find or create user
            const user = await prisma.userProfile.findFirst({
                where: { phone: phone }
            });

            if (!user) {
                 // Option: Auto-create user or return error
                 // For now, mirroring existing logic (404)
                 logAudit({ action: "login_failed", resourceType: "Auth", changes: { phone, reason: "no_such_user", method: "otp" } }).catch(() => {});
                 return res.status(404).json({ error: "User not found with this phone number. Please contact your gym admin." });
            }

            if (!user.isActive) {
                logAudit({ tenantId: user.tenantId, userId: user.id, action: "login_failed", resourceType: "Auth", resourceId: user.id, changes: { reason: "account_disabled", method: "otp" } }).catch(() => {});
                return res.status(403).json({ error: "Your account is disabled." });
            }

            logAudit({ tenantId: user.tenantId, userId: user.id, action: "login_success", resourceType: "Auth", resourceId: user.id, changes: { method: "otp" } }).catch(() => {});

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.status(200).json({
                status: "success",
                token,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    phone: user.phone,
                    role: user.role,
                    tenantId: user.tenantId,
                    avatarUrl: user.avatarUrl
                }
            });

        } catch (error: any) {
            logger.error('Error in verifyOtp controller:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default AuthController;
