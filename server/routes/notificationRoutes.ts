import { Router, Request, Response } from "express"
import { prisma, authenticate } from "../config/db.js"
import { NotificationService } from "../services/notificationService.js"

const router = Router()

// GET /api/notifications — Get notifications for current user
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await NotificationService.getUserNotifications(req.userId!, page, limit)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/notifications/unread-count — Get unread notification count
router.get("/unread-count", authenticate, async (req: Request, res: Response) => {
  try {
    const count = await NotificationService.getUnreadCount(req.userId!)
    res.json({ count })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/notifications/:id/read — Mark notification as read
router.patch("/:id/read", authenticate, async (req: Request, res: Response) => {
  try {
    await NotificationService.markRead(req.params.id, req.userId!)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/notifications/mark-all-read — Mark all notifications as read
router.post("/mark-all-read", authenticate, async (req: Request, res: Response) => {
  try {
    await NotificationService.markAllRead(req.userId!)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/notifications/register-push — Register FCM push token
router.post("/register-push", authenticate, async (req: Request, res: Response) => {
  try {
    const { fcmToken } = req.body
    if (!fcmToken) {
      res.status(400).json({ error: "fcmToken is required" })
      return
    }

    await prisma.userProfile.update({
      where: { id: req.userId! },
      data: { fcmToken },
    })

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
