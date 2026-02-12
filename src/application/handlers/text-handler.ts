import { BaseHandler, HandlerContext, HandlerResult } from './base-handler'
import { messageSender } from '@/infrastructure/messaging/message-sender'
import { logger } from '@/infrastructure/utils/logger'

interface TextHandlerConfig {
  text: string
  nextNodeId?: string
}

export class TextHandler extends BaseHandler {
  type = 'text'

  async execute(context: HandlerContext): Promise<HandlerResult> {
    try {
      const config = context.node.config as TextHandlerConfig

      // Replace variables in text
      const text = this.replaceVariables(config.text, {
        ...context.conversation.context,
        nombre: context.user.name || 'amigo',
        phone: context.user.phone_number,
      })

      // Send text message
      const result = await messageSender.sendText(
        context.accountId,
        context.user.phone_number as any,
        text,
        context.conversation.id as any
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        }
      }

      // Get next node - priority: transitions > config.nextNodeId > 'next' key
      const nextNodeId =
        this.getTransitionNodeId(context.node, 'default') ||
        this.getTransitionNodeId(context.node, 'next') ||
        config.nextNodeId

      return {
        success: true,
        nextNodeId,
      }
    } catch (error) {
      logger.error('TextHandler error', error)
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
