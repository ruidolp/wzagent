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

      // Check if we already sent menu (waiting for response)
      const waitingForResponse = (context.conversation.context as any)?.[`waiting_menu_${context.node.id}`]

      // Check if this is a response to menu (user selected an option)
      if (context.incomingMessage.type === 'interactive' && waitingForResponse) {
        return this.handleMenuResponse(context, config)
      }

      // Check if user sent text as response (fallback)
      if (context.incomingMessage.type === 'text' && waitingForResponse) {
        return this.handleTextResponse(context, config)
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
      updateContext: {
        [`waiting_menu_${context.node.id}`]: true,
      },
      // Stay on this node, waiting for user response
    }
  }

  private handleTextResponse(
    context: HandlerContext,
    config: MenuHandlerConfig
  ): HandlerResult {
    const userText = context.incomingMessage.text?.body?.trim()

    if (!userText) {
      return {
        success: false,
        error: 'No text provided',
      }
    }

    // Find option by ID or title (case insensitive)
    const option = config.options.find(
      (opt) => opt.id.toLowerCase() === userText.toLowerCase() ||
               opt.title.toLowerCase() === userText.toLowerCase()
    )

    if (!option) {
      return {
        success: false,
        error: 'Invalid menu option',
      }
    }

    // Get next node
    const nextNodeId =
      option.nextNodeId ||
      this.getTransitionNodeId(context.node, option.id) ||
      this.getTransitionNodeId(context.node, 'default')

    return {
      success: true,
      nextNodeId,
      updateContext: {
        [`waiting_menu_${context.node.id}`]: false,
      },
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
      updateContext: {
        [`waiting_menu_${context.node.id}`]: false,
      },
    }
  }
}
