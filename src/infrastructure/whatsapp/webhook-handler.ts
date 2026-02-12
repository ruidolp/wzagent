import { getAccountByPhoneNumberId } from '../database/queries/whatsapp-accounts.queries'
import { getTenantById } from '../database/queries/tenants.queries'
import { createWebhookLog } from '../database/queries/webhook-logs.queries'
import { userService } from '@/application/services/user.service'
import { conversationService } from '@/application/services/conversation.service'
import { logger } from '../utils/logger'
import { appConfig } from '../config/app.config'
import type { WhatsAppWebhookEntry, WhatsAppIncomingMessage } from '@/domain/types'

export class WebhookHandler {
  async processWebhook(
    tenantId: string,
    body: any,
    headers: Record<string, any>
  ): Promise<void> {
    try {
      // Log webhook if enabled
      if (appConfig.logging.webhookLogging) {
        await createWebhookLog({
          tenant_id: tenantId,
          method: 'POST',
          headers,
          body,
          response_status: 200,
        })
      }

      // Validate webhook structure
      if (!body.entry || !Array.isArray(body.entry)) {
        logger.warn('Invalid webhook structure', body)
        return
      }

      // Process each entry
      for (const entry of body.entry as WhatsAppWebhookEntry[]) {
        await this.processEntry(tenantId, entry)
      }
    } catch (error) {
      logger.error('Error processing webhook', error)

      if (appConfig.logging.webhookLogging) {
        await createWebhookLog({
          tenant_id: tenantId,
          method: 'POST',
          headers,
          body,
          response_status: 500,
          error: (error as Error).message,
        })
      }

      throw error
    }
  }

  private async processEntry(
    tenantId: string,
    entry: WhatsAppWebhookEntry
  ): Promise<void> {
    for (const change of entry.changes) {
      const value = change.value

      // Get WhatsApp account
      const account = await getAccountByPhoneNumberId(value.metadata.phone_number_id)
      if (!account) {
        console.error('❌ ===============================================')
        console.error('❌ ACCOUNT NOT FOUND!')
        console.error('❌ ===============================================')
        console.error(`📞 Phone Number ID: ${value.metadata.phone_number_id}`)
        console.error(`🔍 This means the webhook is configured but the WhatsApp account doesn't exist in the database`)
        console.error('❌ ===============================================')
        logger.warn('Account not found for phone_number_id', {
          phoneNumberId: value.metadata.phone_number_id,
        })
        continue
      }

      // Get tenant
      const tenant = await getTenantById(tenantId)
      if (!tenant) {
        console.error('❌ ===============================================')
        console.error('❌ TENANT NOT FOUND!')
        console.error('❌ ===============================================')
        console.error(`🏢 Tenant ID: ${tenantId}`)
        console.error('❌ ===============================================')
        logger.warn('Tenant not found', { tenantId })
        continue
      }

      // Process messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          await this.processMessage(tenant, account, message, value.contacts?.[0]?.profile?.name)
        }
      }

      // Process status updates
      if (value.statuses && value.statuses.length > 0) {
        console.log('📊 ===============================================')
        console.log('📊 MESSAGE STATUS UPDATES')
        console.log('📊 ===============================================')
        console.log(`📈 Count: ${value.statuses.length}`)
        value.statuses.forEach((status: any) => {
          console.log(`  🆔 Message ID: ${status.id}`)
          console.log(`  ✅ Status: ${status.status}`)
          console.log(`  👤 Recipient: ${status.recipient_id}`)
        })
        console.log('📊 ===============================================')
        logger.debug('Received status updates', { count: value.statuses.length })
      }
    }
  }

  private async processMessage(
    tenant: any,
    account: any,
    message: WhatsAppIncomingMessage,
    profileName?: string
  ): Promise<void> {
    try {
      // Enhanced logging for incoming messages
      console.log('💬 ===============================================')
      console.log('💬 PROCESSING INCOMING MESSAGE')
      console.log('💬 ===============================================')
      console.log(`👤 From: ${message.from} (${profileName || 'Unknown'})`)
      console.log(`📝 Type: ${message.type}`)
      console.log(`🆔 Message ID: ${message.id}`)
      console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`)
      console.log(`📱 Account: ${account.phone_number}`)
      if (message.type === 'text' && message.text) {
        console.log(`📄 Text: "${message.text.body}"`)
      }
      console.log('💬 ===============================================')

      logger.info('Processing incoming message', {
        from: message.from,
        type: message.type,
        messageId: message.id,
        tenantId: tenant.id,
      })

      // Get or create user
      const user = await userService.getOrCreateUser(
        tenant.id,
        message.from,
        profileName
      )

      // Check if this is a new conversation (first contact or returning after session expired)
      const sessionTimeoutMinutes = tenant.session_timeout_minutes || 3
      const existingConversation = await conversationService.getOrCreateConversation(
        tenant.id,
        account.id,
        user,
        undefined,
        sessionTimeoutMinutes
      )

      const isNewConversation = !existingConversation.current_node_id

      logger.info('Conversation status', {
        conversationId: existingConversation.id,
        currentNodeId: existingConversation.current_node_id,
        activeFlowId: existingConversation.active_flow_id,
        isNewConversation,
        sessionExpiresAt: existingConversation.session_expires_at
      })

      // Get or create conversation
      const conversation = existingConversation

      // Save incoming message
      await conversationService.saveIncomingMessage(conversation, message)

      // Send welcome message if this is a new conversation
      if (isNewConversation) {
        const { messageSender } = await import('@/infrastructure/messaging/message-sender')

        const isKnownUser = user.name !== null
        const welcomeMessage = isKnownUser
          ? tenant.welcome_message_known
          : tenant.welcome_message_new

        if (welcomeMessage) {
          // Replace variables in welcome message
          const processedMessage = welcomeMessage
            .replace(/\{nombre\}/g, user.name || 'amigo')
            .replace(/\{phone\}/g, user.phone_number)

          await messageSender.sendText(
            account.id,
            user.phone_number,
            processedMessage,
            conversation.id
          )

          logger.info('Sent welcome message', {
            userId: user.id,
            isKnownUser,
            messageLength: processedMessage.length
          })
        }
      }

      // Determine which flow to execute
      const { flowExecutionService } = await import('@/application/services/flow-execution.service')
      const flow = await flowExecutionService.determineFlow(
        tenant.id,
        user,
        conversation,
        message
      )

      if (!flow) {
        logger.warn('No flow found for user', { userId: user.id })
        return
      }

      // Execute flow
      await flowExecutionService.executeFlow(
        account.id,
        conversation,
        user,
        message,
        flow
      )

    } catch (error) {
      logger.error('Error processing message', error)
      throw error
    }
  }
}

export const webhookHandler = new WebhookHandler()
