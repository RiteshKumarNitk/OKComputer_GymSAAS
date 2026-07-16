import { Router, Request, Response } from "express"
import { prisma, authenticate } from "../config/db.js"
import { requireRole } from "../middleware/requireRole.js"
import { SmsService } from "../services/smsService.js"
import { WhatsappService } from "../services/whatsappService.js"

const router = Router()
// None of these routes had a role gate before this pass — same role set as
// the "WhatsApp Campaigns" / "Message Templates" sidebar nav items.
const MESSAGING_ROLES = ["gym_owner", "manager"] as const

// POST /api/messages/send-sms — Send an SMS message
router.post("/send-sms", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const { to, body, memberId } = req.body
    if (!to || !body) {
      res.status(400).json({ error: "Recipient (to) and body are required" })
      return
    }

    const result = await SmsService.send(to, body)

    // Log to Message model
    if (result.success) {
      await prisma.message.create({
        data: {
          tenantId: req.tenantId!,
          memberId: memberId || null,
          channel: "sms",
          recipient: to,
          body,
          status: "sent",
          sentAt: new Date(),
          provider: "twilio",
          providerMsgId: result.providerMsgId,
        },
      })
    }

    res.json({
      success: result.success,
      providerMsgId: result.providerMsgId,
      error: result.error,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/messages/send-whatsapp — Send a WhatsApp message
router.post("/send-whatsapp", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const { to, body, memberId } = req.body
    if (!to || !body) {
      res.status(400).json({ error: "Recipient (to) and body are required" })
      return
    }

    const result = await WhatsappService.sendOtp(to, body)

    if (result) {
      await prisma.message.create({
        data: {
          tenantId: req.tenantId!,
          memberId: memberId || null,
          channel: "whatsapp",
          recipient: to,
          body,
          status: "sent",
          sentAt: new Date(),
          provider: "meta",
        },
      })
    }

    res.json({ success: result })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/messages/bulk-sms — Send bulk SMS
router.post("/bulk-sms", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const { recipients } = req.body as { recipients: { phone: string; body: string; memberId?: string }[] }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ error: "Recipients array is required" })
      return
    }

    const result = await SmsService.sendBulk(
      recipients.map((r) => ({ phone: r.phone, body: r.body }))
    )

    // Log all messages
    await prisma.message.createMany({
      data: recipients.map((r) => ({
        tenantId: req.tenantId!,
        memberId: r.memberId || null,
        channel: "sms",
        recipient: r.phone,
        body: r.body,
        status: "sent",
        sentAt: new Date(),
        provider: "twilio",
      })),
    })

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/messages/templates — Create a message template
router.post("/templates", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const { name, triggerKey, channel, subject, body } = req.body
    if (!name || !body) {
      res.status(400).json({ error: "Name and body are required" })
      return
    }

    const template = await prisma.messageTemplate.create({
      data: {
        tenantId: req.tenantId!,
        name,
        triggerKey: triggerKey || null,
        channel: channel || "sms",
        subject: subject || null,
        body,
        isActive: true,
      },
    })

    res.json(template)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/messages/templates — List message templates
router.get("/templates", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.all === "true"
    const templates = await prisma.messageTemplate.findMany({
      where: { tenantId: req.tenantId!, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: "asc" },
    })
    res.json(templates)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/messages/templates/:id — Update a message template
router.patch("/templates/:id", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.messageTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!existing) { res.status(404).json({ error: "Template not found" }); return }

    const { name, triggerKey, channel, subject, body, isActive } = req.body
    const data: any = {}
    if (name) data.name = name
    if (triggerKey !== undefined) data.triggerKey = triggerKey
    if (channel) data.channel = channel
    if (subject !== undefined) data.subject = subject
    if (body) data.body = body
    if (isActive !== undefined) data.isActive = isActive

    const template = await prisma.messageTemplate.update({
      where: { id: req.params.id },
      data,
    })
    res.json(template)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/messages/templates/:id — Delete a message template
router.delete("/templates/:id", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.messageTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })
    if (!existing) { res.status(404).json({ error: "Template not found" }); return }

    await prisma.messageTemplate.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/messages/templates/:id/test — Send test message using template
router.post("/templates/:id/test", authenticate, requireRole(...MESSAGING_ROLES), async (req: Request, res: Response) => {
  try {
    const template = await prisma.messageTemplate.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    })

    if (!template) {
      res.status(404).json({ error: "Template not found" })
      return
    }

    const { to } = req.body
    if (!to) {
      res.status(400).json({ error: "Recipient phone (to) is required" })
      return
    }

    // Replace placeholders with sample values
    let body = template.body
      .replace(/\{\{member_name\}\}/g, "Test Member")
      .replace(/\{\{expiry_date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{gym_name\}\}/g, "Your Gym")

    let result
    if (template.channel === "sms") {
      result = await SmsService.send(to, body)
    } else if (template.channel === "whatsapp") {
      result = { success: await WhatsappService.sendOtp(to, body) }
    } else {
      res.status(400).json({ error: `Channel ${template.channel} not supported yet` })
      return
    }

    res.json({ success: true, body, providerResult: result })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
