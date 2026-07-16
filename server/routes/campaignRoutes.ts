import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"
import { requireRole } from "../middleware/requireRole.js"
import { SmsService } from "../services/smsService.js"
import { WhatsappService } from "../services/whatsappService.js"

const router = Router()
// None of these routes had a role gate before this pass — same role set as
// the "WhatsApp Campaigns" sidebar nav item.
const CAMPAIGN_ROLES = ["gym_owner", "manager"] as const

// GET /api/campaigns — List campaigns
router.get("/", authenticate, requireRole(...CAMPAIGN_ROLES), async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: "desc" },
    })
    res.json(campaigns.map(snakeToCamel))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/campaigns/:id — Get single campaign
router.get("/:id", authenticate, requireRole(...CAMPAIGN_ROLES), async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: { messages: { take: 20, orderBy: { createdAt: "desc" } } },
    })
    if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return }
    res.json(snakeToCamel(campaign))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/campaigns — Create campaign
router.post("/", authenticate, requireRole(...CAMPAIGN_ROLES), async (req: Request, res: Response) => {
  try {
    const { name, channel, subject, body, targetAudience, scheduledAt } = req.body
    if (!name || !body) { res.status(400).json({ error: "Name and body are required" }); return }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId: req.tenantId!,
        name,
        channel: channel || "whatsapp",
        subject: subject || null,
        body,
        targetAudience: targetAudience ? (typeof targetAudience === "string" ? targetAudience : JSON.stringify(targetAudience)) : null,
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: req.userId!,
      },
    })

    res.json(snakeToCamel(campaign))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/campaigns/:id — Update campaign
router.patch("/:id", authenticate, requireRole(...CAMPAIGN_ROLES), async (req: Request, res: Response) => {
  try {
    const { name, channel, subject, body, targetAudience, scheduledAt, status } = req.body

    const existing = await prisma.campaign.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!existing) { res.status(404).json({ error: "Campaign not found" }); return }
    if (existing.status === "running" || existing.status === "completed") {
      res.status(400).json({ error: "Cannot edit a running or completed campaign" }); return
    }

    const data: any = {}
    if (name) data.name = name
    if (channel) data.channel = channel
    if (subject !== undefined) data.subject = subject
    if (body) data.body = body
    if (targetAudience) data.targetAudience = typeof targetAudience === "string" ? targetAudience : JSON.stringify(targetAudience)
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt)
    if (status) data.status = status

    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data,
    })

    res.json(snakeToCamel(campaign))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/campaigns/:id — Delete campaign
router.delete("/:id", authenticate, requireRole(...CAMPAIGN_ROLES), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.campaign.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!existing) { res.status(404).json({ error: "Campaign not found" }); return }
    if (existing.status === "running") {
      res.status(400).json({ error: "Cannot delete a running campaign. Cancel it first." }); return
    }

    await prisma.campaign.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/campaigns/:id/test — Send test message
router.post("/:id/test", authenticate, requireRole(...CAMPAIGN_ROLES), async (req: Request, res: Response) => {
  try {
    const { to } = req.body
    if (!to) { res.status(400).json({ error: "Recipient phone (to) is required" }); return }

    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return }

    // Replace placeholders
    let body = campaign.body
      .replace(/\{\{member_name\}\}/g, "Test Member")
      .replace(/\{\{gym_name\}\}/g, "Your Gym")
      .replace(/\{\{expiry_date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{plan_name\}\}/g, "Premium Plan")

    let result
    if (campaign.channel === "sms") {
      result = await SmsService.send(to, body)
    } else if (campaign.channel === "whatsapp") {
      result = { success: await WhatsappService.sendText(to, body) }
    } else {
      res.status(400).json({ error: `Channel ${campaign.channel} not supported for testing` }); return
    }

    res.json({ success: true, body, providerResult: result })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/campaigns/:id/launch — Launch campaign to target audience
router.post("/:id/launch", authenticate, requireRole(...CAMPAIGN_ROLES), async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return }
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      res.status(400).json({ error: `Campaign is already ${campaign.status}` }); return
    }

    // Determine recipients from target audience config
    let recipients: { phone: string; memberId?: string; name: string }[] = []
    const audience = typeof campaign.targetAudience === "string"
      ? JSON.parse(campaign.targetAudience)
      : campaign.targetAudience || { type: "all_active" }

    if (audience.type === "all_active" || audience.type === "all") {
      const members = await prisma.member.findMany({
        where: {
          tenantId: req.tenantId!,
          status: audience.type === "all_active" ? "active" : undefined,
          phone: { not: null },
        },
        select: { id: true, phone: true, fullName: true },
      })
      recipients = members
        .filter((m) => m.phone)
        .map((m) => ({ phone: m.phone!, memberId: m.id, name: m.fullName }))
    } else if (audience.type === "specific_members" && audience.memberIds?.length) {
      const members = await prisma.member.findMany({
        where: { id: { in: audience.memberIds }, tenantId: req.tenantId!, phone: { not: null } },
        select: { id: true, phone: true, fullName: true },
      })
      recipients = members.map((m) => ({ phone: m.phone!, memberId: m.id, name: m.fullName }))
    } else if (audience.type === "leads" || audience.type === "all_leads") {
      const leads = await prisma.lead.findMany({
        where: {
          tenantId: req.tenantId!,
          phone: { not: null },
          ...(audience.status ? { status: audience.status } : {}),
        },
        select: { id: true, phone: true, fullName: true },
      })
      recipients = leads.map((l) => ({ phone: l.phone!, name: l.fullName || "Lead" }))
    } else if (audience.type === "expiring" && audience.days) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + parseInt(audience.days))
      const members = await prisma.member.findMany({
        where: {
          tenantId: req.tenantId!,
          status: "active",
          phone: { not: null },
          planExpiresAt: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999)),
          },
        },
        select: { id: true, phone: true, fullName: true },
      })
      recipients = members.map((m) => ({ phone: m.phone!, memberId: m.id, name: m.fullName }))
    }

    if (recipients.length === 0) {
      res.status(400).json({ error: "No recipients found for the selected audience" }); return
    }

    // Update campaign to running
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "running",
        sentAt: new Date(),
        totalRecipients: recipients.length,
      },
    })

    // Send messages asynchronously (don't block the response for large campaigns)
    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        let body = campaign.body
          .replace(/\{\{member_name\}\}/g, recipient.name)
          .replace(/\{\{gym_name\}\}/g, "Your Gym")
          .replace(/\{\{expiry_date\}\}/g, new Date().toLocaleDateString())
          .replace(/\{\{plan_name\}\}/g, "Membership")

        let messageResult
        if (campaign.channel === "whatsapp") {
          messageResult = await WhatsappService.sendText(recipient.phone, body)
        } else if (campaign.channel === "sms") {
          messageResult = await SmsService.send(recipient.phone, body)
        } else {
          failed++
          continue
        }

        const msgSuccess = typeof messageResult === "object" ? messageResult.success : messageResult

        await prisma.message.create({
          data: {
            tenantId: req.tenantId!,
            memberId: recipient.memberId || null,
            channel: campaign.channel as any,
            recipient: recipient.phone,
            subject: campaign.subject,
            body,
            status: msgSuccess ? "sent" : "failed",
            sentAt: msgSuccess ? new Date() : null,
            provider: campaign.channel === "whatsapp" ? "meta" : "twilio",
            providerMsgId: typeof messageResult === "object" ? (messageResult as any).providerMsgId : null,
            campaignId: campaign.id,
          },
        })

        if (msgSuccess) sent++
        else failed++
      } catch {
        failed++
      }
    }

    // Mark campaign as completed
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "completed",
        totalSent: sent,
        totalFailed: failed,
      },
    })

    res.json({
      success: true,
      totalRecipients: recipients.length,
      sent,
      failed,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
