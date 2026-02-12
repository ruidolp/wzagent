import { BaseHandler, HandlerContext, HandlerResult } from './base-handler'
import { messageSender } from '@/infrastructure/messaging/message-sender'
import { userService } from '../services/user.service'
import { logger } from '@/infrastructure/utils/logger'

interface CaptureDataHandlerConfig {
  field: string // 'name' | 'email' | custom field
  prompt: string
  validation?: 'email' | 'phone' | 'none'
  saveToUser?: boolean // If true, saves to user table
  nextNodeId?: string
}

export class CaptureDataHandler extends BaseHandler {
  type = 'capture_data'

  async execute(context: HandlerContext): Promise<HandlerResult> {
    try {
      const config = context.node.config as CaptureDataHandlerConfig

      // Check if we're waiting for user response
      const isWaitingForResponse = (context.conversation.context as any)[`waiting_for_${config.field}`]

      if (!isWaitingForResponse) {
        // Send prompt
        return this.sendPrompt(context, config)
      }

      // Process user response
      return this.processResponse(context, config)
    } catch (error) {
      logger.error('CaptureDataHandler error', error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  private async sendPrompt(
    context: HandlerContext,
    config: CaptureDataHandlerConfig
  ): Promise<HandlerResult> {
    const result = await messageSender.sendText(
      context.accountId,
      context.user.phone_number as any,
      config.prompt,
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
        [`waiting_for_${config.field}`]: true,
      },
    }
  }

  private async processResponse(
    context: HandlerContext,
    config: CaptureDataHandlerConfig
  ): Promise<HandlerResult> {
    // Get user input
    let userInput = ''
    if (context.incomingMessage.type === 'text' && context.incomingMessage.text) {
      userInput = context.incomingMessage.text.body.trim()
    }

    // Validate input
    if (config.validation) {
      const isValid = this.validateInput(userInput, config.validation)
      if (!isValid) {
        // Send error and ask again
        await messageSender.sendText(
          context.accountId,
          context.user.phone_number as any,
          `El formato no es válido. ${config.prompt}`,
          context.conversation.id as any
        )

        return {
          success: true,
          // Stay on same node
        }
      }
    }

    // Save to user if configured
    if (config.saveToUser) {
      await userService.updateUserProfile(context.user.id as any, {
        [config.field]: userInput,
      })
    }

    // Update context
    const newContext = {
      ...context.conversation.context,
      [config.field]: userInput,
      [`waiting_for_${config.field}`]: false,
    }

    // Get next node - priority: transitions > config.nextNodeId > 'next' key
    const nextNodeId =
      this.getTransitionNodeId(context.node, 'default') ||
      this.getTransitionNodeId(context.node, 'next') ||
      config.nextNodeId

    return {
      success: true,
      nextNodeId,
      updateContext: newContext,
    }
  }

  private validateInput(input: string, validation: string): boolean {
    switch (validation) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
      case 'phone':
        return /^\+?[1-9]\d{1,14}$/.test(input)
      case 'none':
      default:
        return input.length > 0
    }
  }
}
