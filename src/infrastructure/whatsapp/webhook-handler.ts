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
        logger.warn('Account not found for phone_number_id', {
          phoneNumberId: value.metadata.phone_number_id,
        })
        continue
      }

      // Get tenant
      const tenant = await getTenantById(tenantId)
      if (!tenant) {
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
        // TODO: Update message status in database
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
      logger.info('Processing incoming message', {
        from: message.from,
        type: message.type,
        messageId: message.id,
      })

      // Get or create user
      const user = await userService.getOrCreateUser(
        tenant.id,
        message.from,
        profileName
      )

      // Get or create conversation
      const conversation = await conversationService.getOrCreateConversation(
        tenant.id,
        account.id,
        user
      )

      // Save incoming message
      await conversationService.saveIncomingMessage(conversation, message)

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
