import { BaseHandler, HandlerContext, HandlerResult } from './base-handler'
import { messageSender } from '@/infrastructure/messaging/message-sender'
import { conversationService } from '../services/conversation.service'
import { getDefaultFlow, getFlowById } from '@/infrastructure/database/queries/flows.queries'
import { logger } from '@/infrastructure/utils/logger'

interface EndHandlerConfig {
  message?: string // Optional final message
  action: 'finish' | 'restart' | 'goto_flow'
  flowId?: string // Required if action is 'goto_flow'
}

export class EndHandler extends BaseHandler {
  type = 'end'

  async execute(context: HandlerContext): Promise<HandlerResult> {
    try {
      const config = context.node.config as EndHandlerConfig

      console.log('🔴 ===============================================')
      console.log('🔴 END NODE EXECUTING')
      console.log('🔴 ===============================================')
      console.log('📋 Config:', JSON.stringify(config, null, 2))
      console.log('🎬 Action:', config.action)
      console.log('💬 Message:', config.message)
      console.log('🔴 ===============================================')

      // Send final message if configured
      if (config.message) {
        const message = this.replaceVariables(config.message, {
          ...context.conversation.context,
          nombre: context.user.name || 'amigo',
          phone: context.user.phone_number,
        })

        await messageSender.sendText(
          context.accountId,
          context.user.phone_number as any,
          message,
          context.conversation.id as any
        )
      }

      // Handle different end actions
      switch (config.action) {
        case 'finish':
          console.log('✅ Executing FINISH action')
          // Clear current node to mark conversation as ended
          await conversationService.setCurrentNode(
            context.conversation.id,
            null,
            null
          )

          logger.info('Flow finished', {
            conversationId: context.conversation.id,
            flowId: context.conversation.active_flow_id,
          })

          console.log('✅ FINISH action completed successfully')
          return {
            success: true,
            // No nextNodeId - flow ends here
          }

        case 'restart':
          // Restart to default flow
          const defaultFlow = await getDefaultFlow(context.conversation.tenant_id)

          if (!defaultFlow) {
            logger.warn('No default flow found for restart')
            return {
              success: false,
              error: 'No default flow configured',
            }
          }

          // Clear current node - will restart from root on next message
          await conversationService.setCurrentNode(
            context.conversation.id,
            null,
            defaultFlow.id
          )

          logger.info('Flow restarting to default', {
            conversationId: context.conversation.id,
            defaultFlowId: defaultFlow.id,
          })

          return {
            success: true,
            // No nextNodeId - will restart on next message
          }

        case 'goto_flow':
          if (!config.flowId) {
            logger.error('goto_flow action requires flowId')
            return {
              success: false,
              error: 'Missing flowId for goto_flow action',
            }
          }

          const targetFlow = await getFlowById(config.flowId)

          if (!targetFlow) {
            logger.warn('Target flow not found', { flowId: config.flowId })
            return {
              success: false,
              error: 'Target flow not found',
            }
          }

          // Clear current node and set new flow
          await conversationService.setCurrentNode(
            context.conversation.id,
            null,
            targetFlow.id
          )

          logger.info('Flow transitioning to new flow', {
            conversationId: context.conversation.id,
            targetFlowId: targetFlow.id,
          })

          return {
            success: true,
            // No nextNodeId - will start target flow on next message
          }

        default:
          console.error('❌ Unknown end action:', config.action)
          logger.error('Unknown end action', { action: config.action })
          return {
            success: false,
            error: 'Unknown end action',
          }
      }
    } catch (error) {
      console.error('❌ EndHandler error:', error)
      logger.error('EndHandler error', error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  private replaceVariables(
    text: string,
    variables: Record<string, any>
  ): string {
    let result = text

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(regex, String(value || ''))
    }

    return result
  }
}
