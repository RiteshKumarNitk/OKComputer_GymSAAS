import { prisma } from "../config/db.js"
import logger from "../config/logger.js"
import { NotificationService } from "./notificationService.js"

export class FollowUpService {
  /**
   * Auto-schedule follow-ups for leads that haven't been contacted
   * Creates follow-up 3 days after lead creation if no activity
   */
  static async autoScheduleFollowUps(): Promise<{ created: number }> {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Find leads created 3+ days ago with no follow-up
    const leads = await prisma.lead.findMany({
      where: {
        status: { in: ["new", "contacted"] },
        createdAt: { lte: threeDaysAgo },
        followUps: { none: {} }, // No follow-ups exist
      },
    })

    let created = 0
    for (const lead of leads) {
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 1) // Schedule for tomorrow

      try {
        await prisma.followUp.create({
          data: {
            tenantId: lead.tenantId,
            leadId: lead.id,
            type: "enquiry",
            status: "pending",
            priority: lead.priority || "warm",
            followUpDate,
            notes: `Auto-scheduled: Contact lead "${lead.fullName || lead.firstName}" who hasn't been followed up`,
          },
        })
        created++
      } catch (err: any) {
        logger.error(`[FollowUp] Auto-schedule error for lead ${lead.id}: ${err.message}`)
      }
    }

    if (created > 0) {
      logger.info(`[FollowUp] Auto-scheduled ${created} follow-ups for unattended leads`)
    }

    return { created }
  }

  /**
   * Detect and alert on missed follow-ups
   * Follow-ups that are still pending past their due date
   */
  static async detectMissedFollowUps(): Promise<{ missed: number }> {
    const now = new Date()

    const missedFollowUps = await prisma.followUp.findMany({
      where: {
        status: "pending",
        followUpDate: { lt: now },
      },
      include: {
        lead: { select: { fullName: true, phone: true } },
        assignee: { select: { id: true, fullName: true } },
        tenant: { select: { id: true } },
      },
    })

    // Create in-app notifications for assigned staff
    for (const fu of missedFollowUps) {
      if (fu.assignedTo) {
        try {
          await NotificationService.createInApp({
            tenantId: fu.tenantId,
            userId: fu.assignedTo,
            type: "missed_followup",
            title: "Missed Follow-up",
            message: `Follow-up for ${fu.lead?.fullName || "lead"} was due on ${fu.followUpDate.toLocaleDateString()}`,
            data: { followUpId: fu.id, leadId: fu.leadId },
          })
        } catch (err: any) {
          logger.error(`[FollowUp] Notification error for follow-up ${fu.id}: ${err.message}`)
        }
      }
    }

    if (missedFollowUps.length > 0) {
      logger.info(`[FollowUp] Detected ${missedFollowUps.length} missed follow-ups`)
    }

    return { missed: missedFollowUps.length }
  }

  /**
   * Mark a follow-up as completed and optionally create the next one
   */
  static async completeFollowUp(
    followUpId: string,
    tenantId: string,
    notes?: string,
    scheduleNext?: { daysFromNow: number }
  ) {
    const result = await prisma.followUp.updateMany({
      where: { id: followUpId, tenantId },
      data: {
        status: "completed",
        notes: notes || undefined,
      },
    })
    if (result.count === 0) return null
    const fu = await prisma.followUp.findFirst({ where: { id: followUpId, tenantId } })
    if (!fu) return null

    if (scheduleNext) {
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + scheduleNext.daysFromNow)

      await prisma.followUp.create({
        data: {
          tenantId: fu.tenantId,
          leadId: fu.leadId,
          memberId: fu.memberId,
          type: fu.type,
          status: "pending",
          priority: fu.priority,
          followUpDate: nextDate,
          notes: `Follow-up #2 (auto-scheduled after completion)`,
          assignedTo: fu.assignedTo,
        },
      })
    }

    return fu
  }
}
