import { metaClient } from '../whatsapp/meta-client'
import { getDb } from '../database/kysely'
import { logger } from '../utils/logger'
import type {
  MessagePayload,
  SendResult,
  WhatsAppTextMessage,
  WhatsAppInteractiveMessage,
  TextContent,
  InteractiveContent,
} from '@/domain/types'

export class MessageSender {
  private maxRetries = 3
  private retryDelay = 1000

  async send(
    accountId: string,
    payload: MessagePayload,
    conversationId?: string
  ): Promise<SendResult> {
    try {
      // Get account details
      const account = await getDb()
        .selectFrom('whatsapp_accounts')
        .selectAll()
        .where('id', '=', accountId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()

      if (!account) {
        throw new Error('WhatsApp account not found')
      }

      // Prepare WhatsApp message
      const whatsappMessage = this.buildWhatsAppMessage(payload)

      // Send with retry logic
      let lastError: Error | null = null
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await metaClient.sendMessage(
            account.phone_number_id,
            account.access_token,
            whatsappMessage
          )

          const messageId = response.messages[0].id

          // Save message to database
          if (conversationId) {
            await this.saveMessage(
              conversationId,
              account.tenant_id,
              messageId,
              payload
            )
          }

          return {
            success: true,
            messageId,
          }
        } catch (error) {
          lastError = error as Error
          logger.warn(`Send attempt ${attempt} failed`, error)

          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelay * attempt)
          }
        }
      }

      return {
        success: false,
        error: lastError?.message || 'Failed to send message',
      }
    } catch (error) {
      logger.error('MessageSender error', error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  async sendText(
    accountId: string,
    to: string,
    text: string,
    conversationId?: string
  ): Promise<SendResult> {
    return this.send(
      accountId,
      {
        to,
        type: 'text',
        content: { text },
      },
      conversationId
    )
  }

  async sendInteractive(
    accountId: string,
    payload: MessagePayload,
    conversationId?: string
  ): Promise<SendResult> {
    return this.send(accountId, payload, conversationId)
  }

  private buildWhatsAppMessage(
    payload: MessagePayload
  ): WhatsAppTextMessage | WhatsAppInteractiveMessage {
    const base = {
      messaging_product: 'whatsapp' as const,
      recipient_type: 'individual' as const,
      to: payload.to,
      context: payload.context
        ? { message_id: payload.context.messageId }
        : undefined,
    }

    if (payload.type === 'text') {
      const content = payload.content as TextContent
      return {
        ...base,
        type: 'text',
        text: {
          body: content.text,
          preview_url: content.previewUrl,
        },
      }
    }

    if (payload.type === 'interactive') {
      const content = payload.content as InteractiveContent
      return {
        ...base,
        type: 'interactive',
        interactive: content.interactive,
      }
    }

    throw new Error(`Unsupported message type: ${payload.type}`)
  }

  private async saveMessage(
    conversationId: string,
    tenantId: string,
    whatsappMessageId: string,
    payload: MessagePayload
  ): Promise<void> {
    try {
      let contentText = ''
      if (payload.type === 'text') {
        contentText = (payload.content as TextContent).text
      } else if (payload.type === 'interactive') {
        const interactive = (payload.content as InteractiveContent).interactive
        contentText = interactive.body.text
      }

      await getDb()
        .insertInto('messages')
        .values({
          conversation_id: conversationId,
          tenant_id: tenantId,
          whatsapp_message_id: whatsappMessageId,
          direction: 'outbound',
          type: payload.type,
          content: payload.content as any,
          content_text: contentText,
          status: 'sent',
        })
        .execute()
    } catch (error) {
      logger.error('Failed to save outbound message', error)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const messageSender = new MessageSender()
