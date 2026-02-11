import type { WhatsAppIncomingMessage } from '@/domain/types'

export interface HandlerContext {
  conversation: any
  user: any
  node: any
  incomingMessage: WhatsAppIncomingMessage
  accountId: string
}

export interface HandlerResult {
  success: boolean
  nextNodeId?: string
  updateContext?: Record<string, any>
  error?: string
}

export abstract class BaseHandler {
  abstract type: string

  abstract execute(context: HandlerContext): Promise<HandlerResult>

  protected getTransitionNodeId(
    node: any,
    key: string
  ): string | undefined {
    if (!node.transitions) return undefined
    return node.transitions[key]
  }

  protected mergeContext(
    existingContext: Record<string, any>,
    newContext: Record<string, any>
  ): Record<string, any> {
    return {
      ...existingContext,
      ...newContext,
    }
  }
}
