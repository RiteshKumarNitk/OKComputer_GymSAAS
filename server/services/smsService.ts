import twilio from "twilio"
import logger from "../config/logger.js"

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

let twilioClient: any = null

function getClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null
  }
  if (!twilioClient) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  }
  return twilioClient
}

export class SmsService {
  /**
   * Send an SMS message using Twilio
   */
  static async send(
    to: string,
    body: string,
    retryCount = 1
  ): Promise<{ success: boolean; providerMsgId?: string; error?: string }> {
    const client = getClient()
    if (!client) {
      logger.warn("⚠️ Twilio not configured — SMS not sent. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.")
      return { success: false, error: "Twilio not configured" }
    }

    // Clean phone number: remove non-digits, prepend + if needed
    let cleanPhone = to.replace(/\D/g, "")
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}` // Default India
    if (!cleanPhone.startsWith("+")) cleanPhone = `+${cleanPhone}`

    try {
      const message = await client.messages.create({
        body,
        from: TWILIO_PHONE_NUMBER,
        to: cleanPhone,
      })

      logger.info(`✅ SMS sent to ${cleanPhone}: ${message.sid}`)
      return { success: true, providerMsgId: message.sid }
    } catch (error: any) {
      logger.error(`❌ Twilio SMS Error for ${cleanPhone}:`, error.message)

      if (retryCount > 0) {
        logger.info(`Retrying SMS to ${cleanPhone}...`)
        return this.send(to, body, retryCount - 1)
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Send an OTP via SMS
   */
  static async sendOtp(phone: string, otp: string): Promise<boolean> {
    const body = `Your Gym Management OTP is: ${otp}. Valid for 5 minutes.`
    const result = await this.send(phone, body)
    return result.success
  }

  /**
   * Send a bulk SMS to multiple recipients
   */
  static async sendBulk(
    recipients: { phone: string; body: string }[]
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const r of recipients) {
      const result = await this.send(r.phone, r.body)
      if (result.success) sent++
      else failed++
    }

    return { sent, failed }
  }
}
