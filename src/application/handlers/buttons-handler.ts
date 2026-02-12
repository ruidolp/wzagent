import { BaseHandler, HandlerContext, HandlerResult } from './base-handler'
import { messageSender } from '@/infrastructure/messaging/message-sender'
import { logger } from '@/infrastructure/utils/logger'

interface ButtonsHandlerConfig {
  body: string
  footer?: string
  buttons: ButtonOption[]
}

interface ButtonOption {
  id: string
  title: string
  nextNodeId?: string
}

export class ButtonsHandler extends BaseHandler {
  type = 'buttons'

  async execute(context: HandlerContext): Promise<HandlerResult> {
    try {
      const config = context.node.config as ButtonsHandlerConfig

      // Check if this is a response to buttons (user clicked a button)
      if (context.incomingMessage.type === 'interactive') {
        return this.handleButtonResponse(context, config)
      }

      // Send buttons
      return this.sendButtons(context, config)
    } catch (error) {
      logger.error('ButtonsHandler error', error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  private async sendButtons(
    context: HandlerContext,
    config: ButtonsHandlerConfig
  ): Promise<HandlerResult> {
    // WhatsApp buttons format (max 3 buttons)
    const buttons = config.buttons.slice(0, 3).map((btn) => ({
      type: 'reply' as const,
      reply: {
        id: btn.id,
        title: btn.title.substring(0, 20), // Max 20 chars
      },
    }))

    const interactive = {
      type: 'button' as const,
      body: {
        text: config.body,
      },
      action: {
        buttons,
      },
    }

    if (config.footer) {
      (interactive as any).footer = {
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

  private handleButtonResponse(
    context: HandlerContext,
    config: ButtonsHandlerConfig
  ): HandlerResult {
    const interactive = context.incomingMessage.interactive

    console.log('🔵 ===============================================')
    console.log('🔵 BUTTON RESPONSE RECEIVED')
    console.log('🔵 ===============================================')
    console.log('📨 Full message:', JSON.stringify(context.incomingMessage, null, 2))
    console.log('🎯 Interactive:', JSON.stringify(interactive, null, 2))
    console.log('⚙️  Config buttons:', JSON.stringify(config.buttons, null, 2))
    console.log('🔵 ===============================================')

    if (!interactive?.button_reply) {
      console.error('❌ No button_reply found in interactive message')
      return {
        success: false,
        error: 'Invalid interactive response',
      }
    }

    const selectedId = interactive.button_reply.id
    console.log('🆔 Selected button ID:', selectedId)

    // Find the button
    const button = config.buttons.find((btn) => btn.id === selectedId)

    if (!button) {
      console.error('❌ Button not found with ID:', selectedId)
      console.error('❌ Available button IDs:', config.buttons.map(b => b.id))
      return {
        success: false,
        error: 'Invalid button option',
      }
    }

    console.log('✅ Button found:', JSON.stringify(button, null, 2))

    // Get next node - priority: button.nextNodeId > transitions > default
    const nextNodeId =
      button.nextNodeId ||
      this.getTransitionNodeId(context.node, selectedId) ||
      this.getTransitionNodeId(context.node, 'default')

    return {
      success: true,
      nextNodeId,
    }
  }
}
