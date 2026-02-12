import { BaseHandler } from './base-handler'
import { TextHandler } from './text-handler'
import { MenuHandler } from './menu-handler'
import { ButtonsHandler } from './buttons-handler'
import { CaptureDataHandler } from './capture-data-handler'
import { EndHandler } from './end-handler'
import { logger } from '@/infrastructure/utils/logger'

export class HandlerRegistry {
  private handlers: Map<string, BaseHandler> = new Map()

  register(handler: BaseHandler) {
    this.handlers.set(handler.type, handler)
    logger.info(`Registered handler: ${handler.type}`)
  }

  get(type: string): BaseHandler | undefined {
    return this.handlers.get(type)
  }

  getAll(): BaseHandler[] {
    return Array.from(this.handlers.values())
  }
}

// Create singleton registry and auto-register handlers
export const handlerRegistry = new HandlerRegistry()

// Register handlers
handlerRegistry.register(new TextHandler())
handlerRegistry.register(new MenuHandler())
handlerRegistry.register(new ButtonsHandler())
handlerRegistry.register(new CaptureDataHandler())
handlerRegistry.register(new EndHandler())

// Future handlers can be registered here:
// handlerRegistry.register(new AIHandler())
// handlerRegistry.register(new WebhookHandler())
// handlerRegistry.register(new ConditionHandler())
