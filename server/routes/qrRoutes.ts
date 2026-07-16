import { Router, Request, Response } from "express"
import { prisma, authenticate, snakeToCamel } from "../config/db.js"
import { QrService } from "../services/qrService.js"

const router = Router()

// POST /api/qr/checkin — QR-based check-in (used by kiosk scanner)
router.post("/checkin", async (req: Request, res: Response) => {
  try {
    const { token, tenantId } = req.body
    if (!token || !tenantId) {
      res.status(400).json({ error: "Token and tenantId are required" })
      return
    }

    const result = await QrService.validateAndCheckin(token, tenantId)
    if (!result.success) {
      res.status(400).json(result)
      return
    }

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/qr/member — Get member's QR code data (requires auth)
router.get("/member", authenticate, async (req: Request, res: Response) => {
  try {
    const memberId = req.query.memberId as string
    const tenantId = req.tenantId!

    // If no memberId specified, find the member associated with the current user
    let targetMemberId = memberId
    if (!targetMemberId) {
      const member = await prisma.member.findUnique({
        where: { userId: req.userId },
      })
      if (!member) {
        res.status(404).json({ error: "Member profile not found" })
        return
      }
      targetMemberId = member.id
    }

    const qrData = await QrService.getMemberQrData(targetMemberId, tenantId)
    if (!qrData) {
      res.status(404).json({ error: "Member not found" })
      return
    }

    res.json(snakeToCamel(qrData))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/qr/refresh — Refresh QR token
router.post("/refresh", authenticate, async (req: Request, res: Response) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.userId },
    })
    if (!member) {
      res.status(404).json({ error: "Member profile not found" })
      return
    }

    const qrData = await QrService.generateToken(member.id, req.tenantId!)
    res.json(snakeToCamel(qrData))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
