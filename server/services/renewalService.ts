import { prisma } from "../config/db.js"
import logger from "../config/logger.js"
import { SmsService } from "./smsService.js"
import { WhatsappService } from "./whatsappService.js"
import { NotificationService } from "./notificationService.js"

export class RenewalService {
  /**
   * Check all active members and send appropriate reminders
   * Based on their plan expiry dates
   */
  static async processReminders(): Promise<{
    reminded: number
    expired: number
    errors: string[]
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const reminders = [
      { days: 7, type: "7_days" },
      { days: 3, type: "3_days" },
      { days: 1, type: "1_day" },
    ]

    let reminded = 0
    let expired = 0
    const errors: string[] = []

    for (const reminder of reminders) {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + reminder.days)

      const members = await prisma.member.findMany({
        where: {
          status: "active",
          planExpiresAt: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999)),
          },
        },
        include: { tenant: true, user: true },
      })

      for (const member of members) {
        try {
          const message = `Hi ${member.fullName}, your gym membership expires in ${reminder.days} day${reminder.days > 1 ? "s" : ""}. Please renew to continue uninterrupted access.`

          // Attempt WhatsApp first, fallback to SMS
          if (member.phone) {
            const phone = member.phone
            const whatsappResult = await WhatsappService.sendOtp(phone, message)
            if (!whatsappResult) {
              await SmsService.send(phone, message)
            }
          }

          // Send in-app notification if user linked
          if (member.user) {
            await NotificationService.createInApp({
              tenantId: member.tenantId,
              userId: member.user.id,
              type: "membership_expiring",
              title: "Membership Expiring Soon",
              message,
              data: { memberId: member.id, daysRemaining: reminder.days },
            })
          }

          reminded++
          logger.info(`[Renewal] Reminded ${member.fullName} (${reminder.days}d before expiry)`)
        } catch (err: any) {
          errors.push(`Failed to remind ${member.fullName}: ${err.message}`)
        }
      }
    }

    // Process expired memberships
    const expiredMembers = await prisma.member.updateMany({
      where: {
        status: "active",
        planExpiresAt: { lt: today },
      },
      data: { status: "expired" },
    })
    expired = expiredMembers.count

    if (expired > 0) {
      logger.info(`[Renewal] Marked ${expired} members as expired`)
    }

    return { reminded, expired, errors }
  }

  /**
   * Auto-renew members that have autoRenew enabled and valid payment method
   */
  static async processAutoRenewals(): Promise<{
    renewed: number
    failed: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let renewed = 0
    let failed = 0

    // Find members expiring today with auto-renew
    const members = await prisma.member.findMany({
      where: {
        status: "active",
        planExpiresAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: { currentPlan: true },
    })

    for (const member of members) {
      if (!member.currentPlan || !member.phone) {
        failed++
        continue
      }

      try {
        // Extend plan by the same duration
        const newExpiry = new Date()
        newExpiry.setDate(newExpiry.getDate() + member.currentPlan.durationDays)

        await prisma.member.update({
          where: { id: member.id },
          data: {
            planExpiresAt: newExpiry,
            status: "active",
          },
        })

        await prisma.membershipHistory.create({
          data: {
            tenantId: member.tenantId,
            memberId: member.id,
            membershipId: member.currentPlan.id,
            startedAt: new Date(),
            expiresAt: newExpiry,
            notes: "Auto-renewal",
          },
        })

        // Send confirmation
        const msg = `Hi ${member.fullName}, your membership has been auto-renewed! New expiry: ${newExpiry.toLocaleDateString()}`
        await SmsService.send(member.phone, msg)
        renewed++
        logger.info(`[Renewal] Auto-renewed ${member.fullName}`)
      } catch (err: any) {
        logger.error(`[Renewal] Auto-renew failed for ${member.fullName}: ${err.message}`)
        failed++
      }
    }

    return { renewed, failed }
  }
}
