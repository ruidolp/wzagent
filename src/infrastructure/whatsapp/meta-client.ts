import { appConfig } from '../config/app.config'
import { logger } from '../utils/logger'
import type {
  WhatsAppApiResponse,
  WhatsAppApiError,
  WhatsAppTextMessage,
  WhatsAppInteractiveMessage,
} from '@/domain/types'

export class MetaClient {
  private baseUrl: string
  private apiVersion: string

  constructor() {
    this.baseUrl = appConfig.whatsapp.apiBaseUrl
    this.apiVersion = appConfig.whatsapp.apiVersion
  }

  async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    message: WhatsAppTextMessage | WhatsAppInteractiveMessage
  ): Promise<WhatsAppApiResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`

    logger.debug('Sending message to Meta API', { url, message })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
      })

      const data = await response.json()

      if (!response.ok) {
        const error = data as WhatsAppApiError
        logger.error('Meta API error', error)
        throw new Error(error.error.message)
      }

      logger.info('Message sent successfully', { messageId: data.messages[0].id })
      return data as WhatsAppApiResponse
    } catch (error) {
      logger.error('Failed to send message', error)
      throw error
    }
  }

  async markAsRead(
    phoneNumberId: string,
    accessToken: string,
    messageId: string
  ): Promise<void> {
    const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      })
    } catch (error) {
      logger.error('Failed to mark message as read', error)
    }
  }
}

// Singleton instance
export const metaClient = new MetaClient()
