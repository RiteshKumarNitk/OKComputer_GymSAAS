import { prisma } from "../config/db.js"
import logger from "../config/logger.js"
import admin from "firebase-admin"

export class NotificationService {
  /**
   * Create an in-app notification for a user
   */
  static async createInApp(params: {
    tenantId: string
    userId: string
    type: string
    title: string
    message: string
    data?: any
  }) {
    const { tenantId, userId, type, title, message, data } = params

    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId,
        notificationType: type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        isRead: false,
      },
    })

    return notification
  }

  /**
   * Create notification for multiple users (broadcast)
   */
  static async broadcast(params: {
    tenantId: string
    userIds: string[]
    type: string
    title: string
    message: string
    data?: any
  }) {
    const { tenantId, userIds, type, title, message, data } = params

    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        tenantId,
        userId,
        notificationType: type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      })),
    })

    return notifications
  }

  /**
   * Send FCM push notification to a user's device
   */
  static async sendPush(params: {
    userId: string
    title: string
    body: string
    data?: Record<string, string>
  }) {
    const { userId, title, body, data } = params

    // Get user's FCM token
    const user = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    })

    if (!user?.fcmToken) {
      logger.warn(`No FCM token for user ${userId}`)
      return false
    }

    if (!admin.apps.length) {
      logger.warn("Firebase not initialized — cannot send push notification")
      return false
    }

    try {
      const message = {
        token: user.fcmToken,
        notification: { title, body },
        data: data || {},
      }

      const response = await admin.messaging().send(message)
      logger.info(`✅ Push sent to ${userId}: ${response}`)
      return true
    } catch (error: any) {
      logger.error(`❌ Push notification error for ${userId}:`, error.message)
      return false
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendPushBulk(params: {
    userIds: string[]
    title: string
    body: string
    data?: Record<string, string>
  }) {
    const { userIds, title, body, data } = params

    const users = await prisma.userProfile.findMany({
      where: { id: { in: userIds }, fcmToken: { not: null } },
      select: { id: true, fcmToken: true },
    })

    let sent = 0
    for (const user of users) {
      const success = await this.sendPush({
        userId: user.id,
        title,
        body,
        data,
      })
      if (success) sent++
    }

    return { sent, total: users.length }
  }

  /**
   * Mark notification as read
   */
  static async markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    })
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ])

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
