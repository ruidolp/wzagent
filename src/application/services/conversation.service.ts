import {
  getActiveConversation,
  createConversation,
  updateConversation,
  updateConversationContext,
} from '@/infrastructure/database/queries/conversations.queries'
import { createMessage } from '@/infrastructure/database/queries/messages.queries'
import { logger } from '@/infrastructure/utils/logger'
import type { Conversations, Users } from '@/infrastructure/database/types'
import type { WhatsAppIncomingMessage } from '@/domain/types'

export class ConversationService {
  async getOrCreateConversation(
    tenantId: string,
    whatsappAccountId: string,
    user: any,
    flowId?: string
  ): Promise<any> {
    try {
      // Check for active conversation
      let conversation = await getActiveConversation(user.id as any)

      if (conversation) {
        // Extend session
        const sessionExpiresAt = new Date()
        sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24)

        const updated = await updateConversation(conversation.id as any, {
          session_expires_at: sessionExpiresAt as any,
        })

        logger.debug('Found active conversation', { conversationId: conversation.id })
        return updated || conversation
      }

      // Create new conversation
      const sessionExpiresAt = new Date()
      sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24)

      logger.info('Creating new conversation', { userId: user.id, tenantId })
      conversation = await createConversation({
        tenant_id: tenantId,
        whatsapp_account_id: whatsappAccountId,
        user_id: user.id as any,
        active_flow_id: flowId,
        session_expires_at: sessionExpiresAt as any,
        context: {},
      })

      return conversation
    } catch (error) {
      logger.error('Error in getOrCreateConversation', error)
      throw error
    }
  }

  async saveIncomingMessage(
    conversation: any,
    message: WhatsAppIncomingMessage
  ): Promise<void> {
    try {
      let contentText = ''
      if (message.type === 'text' && message.text) {
        contentText = message.text.body
      } else if (message.type === 'interactive' && message.interactive) {
        if (message.interactive.list_reply) {
          contentText = message.interactive.list_reply.title
        } else if (message.interactive.button_reply) {
          contentText = message.interactive.button_reply.title
        }
      }

      await createMessage({
        conversation_id: conversation.id as any,
        tenant_id: conversation.tenant_id as any,
        whatsapp_message_id: message.id,
        direction: 'inbound',
        type: message.type,
        content: message as any,
        content_text: contentText,
      })

      logger.debug('Saved incoming message', { messageId: message.id })
    } catch (error) {
      logger.error('Error saving incoming message', error)
      throw error
    }
  }

  async updateContext(
    conversationId: string,
    newContext: Record<string, any>
  ): Promise<void> {
    try {
      await updateConversationContext(conversationId, newContext)
      logger.debug('Updated conversation context', { conversationId })
    } catch (error) {
      logger.error('Error updating conversation context', error)
      throw error
    }
  }

  async setCurrentNode(
    conversationId: string,
    nodeId: string,
    flowId?: string
  ): Promise<void> {
    try {
      const updates: any = { current_node_id: nodeId }
      if (flowId) {
        updates.active_flow_id = flowId
      }

      await updateConversation(conversationId, updates)
      logger.debug('Updated current node', { conversationId, nodeId })
    } catch (error) {
      logger.error('Error setting current node', error)
      throw error
    }
  }
}

export const conversationService = new ConversationService()
