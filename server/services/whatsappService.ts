import axios from 'axios';
import logger from '../config/logger.js';

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || `https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || 'otp_verification';

export class WhatsappService {
    /**
     * Send a free-form text message via WhatsApp
     */
    static async sendText(phone: string, message: string, retryCount = 1): Promise<boolean> {
        if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            logger.error('WhatsApp configuration missing');
            return false;
        }

        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = `91${cleanPhone}`;
        }

        const data = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: message },
        };

        try {
            const response = await axios.post(WHATSAPP_API_URL, data, {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            logger.info(`WhatsApp text sent to ${cleanPhone}: ${response.status}`);
            return true;
        } catch (error: any) {
            const errorDetails = error.response?.data || error.message;
            logger.error(`❌ Meta API Error for ${cleanPhone}: ${JSON.stringify(errorDetails, null, 2)}`);

            if (retryCount > 0) {
                logger.info(`Retrying WhatsApp text to ${cleanPhone}...`);
                return this.sendText(phone, message, retryCount - 1);
            }

            return false;
        }
    }

    static async sendOtp(phone: string, otp: string, retryCount = 1): Promise<boolean> {
        if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            logger.error('WhatsApp configuration missing');
            return false;
        }

        // Meta requires numeric only phone format (e.g. 919876543210)
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Auto-fix: If 10 digits, assume India (91)
        if (cleanPhone.length === 10) {
            cleanPhone = `91${cleanPhone}`;
        }

        const data = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
                name: WHATSAPP_TEMPLATE_NAME,
                language: {
                    code: "en_US"
                },
                // Only add components if template is NOT hello_world (which takes no params)
                ...(WHATSAPP_TEMPLATE_NAME !== 'hello_world' ? {
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: otp
                                }
                            ]
                        }
                    ]
                } : {})
            }
        };

        try {
            const response = await axios.post(WHATSAPP_API_URL, data, {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            logger.info(`WhatsApp OTP sent to ${cleanPhone}: ${response.status}`);
            return true;
        } catch (error: any) {
            const errorDetails = error.response?.data || error.message;
            logger.error(`❌ Meta API Error for ${cleanPhone}: ${JSON.stringify(errorDetails, null, 2)}`);
            
            if (retryCount > 0) {
                logger.info(`Retrying WhatsApp OTP to ${cleanPhone}...`);
                return this.sendOtp(phone, otp, retryCount - 1);
            }
            
            return false;
        }
    }
}

export default WhatsappService;
