import { prisma } from "../config/db.js"
import crypto from "crypto"

const QR_TOKEN_EXPIRY_MINUTES = 5 // Tokens expire after 5 minutes
const QR_REFRESH_INTERVAL_MINUTES = 4 // Refresh token every 4 minutes for active members

export class QrService {
  /**
   * Generate a new QR token for a member
   * Stores the hashed token + expiry in the database
   */
  static async generateToken(memberId: string, tenantId: string): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + QR_TOKEN_EXPIRY_MINUTES * 60 * 1000)

    // updateMany (not update) because we're filtering on id + tenantId together
    // and don't need the row back — this function already knows what it wrote.
    await prisma.member.updateMany({
      where: { id: memberId, tenantId },
      data: {
        qrToken: rawToken,
        qrTokenExpiresAt: expiresAt,
      },
    })

    return { token: rawToken, expiresAt }
  }

  /**
   * Validate a QR token and check in the member if valid
   */
  static async validateAndCheckin(token: string, tenantId: string): Promise<{
    success: boolean
    message: string
    member?: any
  }> {
    // Find member by QR token
    const member = await prisma.member.findFirst({
      where: { qrToken: token, tenantId },
      include: { currentPlan: true },
    })

    if (!member) {
      return { success: false, message: "Invalid QR code. Please scan a valid member QR." }
    }

    // Check token expiry
    if (member.qrTokenExpiresAt && new Date(member.qrTokenExpiresAt) < new Date()) {
      return { success: false, message: "QR code has expired. Please refresh and try again." }
    }

    // Check member status
    if (member.status !== "active") {
      return { success: false, message: `Member status is "${member.status}". Cannot check in.` }
    }

    // Check plan expiry
    if (member.planExpiresAt && new Date(member.planExpiresAt) < new Date()) {
      await prisma.member.updateMany({
        where: { id: member.id, tenantId },
        data: { status: "expired" },
      })
      return { success: false, message: "Membership has expired. Please renew." }
    }

    // Check if already checked in today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const existing = await prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        tenantId,
        checkinAt: { gte: todayStart },
      },
    })

    if (existing) {
      return { success: false, message: "Already checked in today!" }
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        tenantId,
        memberId: member.id,
        checkinAt: new Date(),
        deviceInfo: JSON.stringify({ type: "qr_scanner" }),
      },
    })

    // Update fitness stats
    await prisma.memberFitnessStats.upsert({
      where: { memberId: member.id },
      update: {
        totalCheckIns: { increment: 1 },
        currentStreak: { increment: 1 },
        lastCheckInDate: new Date(),
      },
      create: {
        memberId: member.id,
        tenantId,
        totalCheckIns: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastCheckInDate: new Date(),
      },
    })

    // Generate a fresh token for next use
    await this.generateToken(member.id, tenantId)

    return {
      success: true,
      message: `Welcome, ${member.fullName}!`,
      member: {
        id: member.id,
        fullName: member.fullName,
        memberCode: member.memberCode,
      },
    }
  }

  /**
   * Get or refresh a member's QR token data
   */
  static async getMemberQrData(memberId: string, tenantId: string): Promise<{
    token: string
    expiresAt: Date
    memberCode: string
  } | null> {
    // Filter by tenantId in the query itself, not just as a post-fetch check.
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
    })

    if (!member) return null

    // Check if current token is still valid or needs refresh
    const needsRefresh =
      !member.qrToken ||
      !member.qrTokenExpiresAt ||
      new Date(member.qrTokenExpiresAt) < new Date()

    if (needsRefresh) {
      return await this.generateToken(member.id, tenantId)
    }

    return {
      token: member.qrToken!,
      expiresAt: member.qrTokenExpiresAt!,
      memberCode: member.memberCode,
    }
  }
}
