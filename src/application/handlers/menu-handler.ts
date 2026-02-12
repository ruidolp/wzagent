import { BaseHandler, HandlerContext, HandlerResult } from './base-handler'
import { messageSender } from '@/infrastructure/messaging/message-sender'
import { logger } from '@/infrastructure/utils/logger'
import type { WhatsAppInteractive, WhatsAppRow } from '@/domain/types'

interface MenuHandlerConfig {
  header?: string
  body: string
  footer?: string
  buttonText?: string
  options: MenuOption[]
}

interface MenuOption {
  id: string
  title: string
  description?: string
  nextNodeId: string
}

export class MenuHandler extends BaseHandler {
  type = 'menu'

  async execute(context: HandlerContext): Promise<HandlerResult> {
    try {
      const config = context.node.config as MenuHandlerConfig

      // Check if this is a response to menu (user selected an option)
      if (context.incomingMessage.type === 'interactive') {
        return this.handleMenuResponse(context, config)
      }

      // Send menu
      return this.sendMenu(context, config)
    } catch (error) {
      logger.error('MenuHandler error', error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  private async sendMenu(
    context: HandlerContext,
    config: MenuHandlerConfig
  ): Promise<HandlerResult> {
    const interactive: WhatsAppInteractive = {
      type: 'list',
      body: {
        text: config.body,
      },
      action: {
        button: config.buttonText || 'Ver opciones',
        sections: [
          {
            rows: config.options.map((opt) => ({
              id: opt.id,
              title: opt.title,
              description: opt.description,
            })),
          },
        ],
      },
    }

    if (config.header) {
      interactive.header = {
        type: 'text',
        text: config.header,
      }
    }

    if (config.footer) {
      interactive.footer = {
        text: config.footer,
      }
    }

    const result = await messageSender.send(
      context.accountId,
      {
        to: context.user.phone_number as any,
        type: 'interactive',
        content: { interactive },
      },
      context.conversation.id as any
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      success: true,
      // Stay on this node, waiting for user response
    }
  }

  private handleMenuResponse(
    context: HandlerContext,
    config: MenuHandlerConfig
  ): HandlerResult {
    const interactive = context.incomingMessage.interactive

    console.log('🟣 ===============================================')
    console.log('🟣 MENU RESPONSE RECEIVED')
    console.log('🟣 ===============================================')
    console.log('📨 Full message:', JSON.stringify(context.incomingMessage, null, 2))
    console.log('🎯 Interactive:', JSON.stringify(interactive, null, 2))
    console.log('⚙️  Config options:', JSON.stringify(config.options, null, 2))
    console.log('🟣 ===============================================')

    if (!interactive?.list_reply) {
      console.error('❌ No list_reply found in interactive message')
      return {
        success: false,
        error: 'Invalid interactive response',
      }
    }

    const selectedId = interactive.list_reply.id
    console.log('🆔 Selected option ID:', selectedId)

    // Find the option
    const option = config.options.find((opt) => opt.id === selectedId)

    if (!option) {
      console.error('❌ Option not found with ID:', selectedId)
      console.error('❌ Available option IDs:', config.options.map(o => o.id))
      return {
        success: false,
        error: 'Invalid menu option',
      }
    }

    console.log('✅ Option found:', JSON.stringify(option, null, 2))

    // Get next node - priority: option.nextNodeId > transitions > default
    const nextNodeId =
      option.nextNodeId ||
      this.getTransitionNodeId(context.node, selectedId) ||
      this.getTransitionNodeId(context.node, 'default')

    return {
      success: true,
      nextNodeId,
    }
  }
}
