import { getFlowById, getFlowByTrigger, getDefaultFlow } from '@/infrastructure/database/queries/flows.queries'
import { getNodeById, getRootNodes } from '@/infrastructure/database/queries/flow-nodes.queries'
import { getTenantById } from '@/infrastructure/database/queries/tenants.queries'
import { conversationService } from './conversation.service'
import { messageSender } from '@/infrastructure/messaging/message-sender'
import { handlerRegistry } from '../handlers/registry'
import { logger } from '@/infrastructure/utils/logger'
import type { Flows, Conversations, Users } from '@/infrastructure/database/types'
import type { WhatsAppIncomingMessage } from '@/domain/types'

export class FlowExecutionService {
  async determineFlow(
    tenantId: string,
    user: any,
    conversation: any,
    message: WhatsAppIncomingMessage
  ): Promise<any> {
    try {
      // Check for "MENU" keyword to reset to default flow
      if (message.type === 'text' && message.text?.body.toUpperCase() === 'MENU') {
        const defaultFlow = await getDefaultFlow(tenantId)
        return defaultFlow || null
      }

      // If conversation exists and has active flow, use it
      if (conversation?.active_flow_id) {
        const flow = await getFlowById(conversation.active_flow_id)
        if (flow) return flow
      }

      // Check tenant's configured flows for new/known users
      const tenant = await getTenantById(tenantId)
      if (tenant) {
        const isKnown = user.name !== null
        const configuredFlowId = isKnown ? tenant.known_user_flow_id : tenant.new_user_flow_id

        if (configuredFlowId) {
          const flow = await getFlowById(configuredFlowId)
          if (flow) {
            logger.info('Using tenant-configured flow', {
              flowId: flow.id,
              userType: isKnown ? 'known' : 'new'
            })
            return flow
          }
        }
      }

      // Fallback to trigger_type matching
      const isKnown = user.name !== null
      const triggerType = isKnown ? 'known_user' : 'new_user'
      const flow = await getFlowByTrigger(tenantId, triggerType)

      if (flow) return flow

      // Fallback to default flow
      return await getDefaultFlow(tenantId)
    } catch (error) {
      logger.error('Error determining flow', error)
      return null
    }
  }

  async executeFlow(
    accountId: string,
    conversation: any,
    user: any,
    message: WhatsAppIncomingMessage,
    flow: any
  ): Promise<void> {
    try {
      logger.info('Executing flow', { flowId: flow.id, flowName: flow.name })

      let currentNodeId = conversation.current_node_id

      // If no current node, start from root
      if (!currentNodeId) {
        const rootNodes = await getRootNodes(flow.id)
        if (rootNodes.length === 0) {
          logger.warn('No root nodes found for flow', { flowId: flow.id })
          await this.sendDefaultMessage(accountId, user.phone_number, conversation.id)
          // Mark conversation with a dummy node to prevent re-sending welcome message
          await conversationService.setCurrentNode(
            conversation.id,
            'no_nodes',
            flow.id
          )
          return
        }
        currentNodeId = rootNodes[0].id
      }

      // Execute nodes sequentially
      let maxIterations = 10 // Prevent infinite loops
      let iterations = 0

      while (currentNodeId && iterations < maxIterations) {
        iterations++

        const node = await getNodeById(currentNodeId)
        if (!node) {
          logger.warn('Node not found', { nodeId: currentNodeId })
          break
        }

        // Get handler for node type
        const handler = handlerRegistry.get(node.node_type)
        if (!handler) {
          logger.error('Handler not found for node type', { nodeType: node.node_type })
          break
        }

        // Execute handler
        const result = await handler.execute({
          conversation,
          user,
          node,
          incomingMessage: message,
          accountId,
        })

        if (!result.success) {
          logger.error('Handler execution failed', { error: result.error })
          await this.sendErrorMessage(accountId, user.phone_number, conversation.id)
          break
        }

        // Update context if provided
        if (result.updateContext) {
          const newContext = {
            ...conversation.context,
            ...result.updateContext,
          }
          await conversationService.updateContext(conversation.id, newContext)
          // Update local reference
          conversation.context = newContext
        }

        // Move to next node if provided
        if (result.nextNodeId) {
          currentNodeId = result.nextNodeId
          await conversationService.setCurrentNode(
            conversation.id,
            currentNodeId,
            flow.id
          )
        } else {
          // For 'end' nodes, don't update current_node_id (handler already cleared it)
          if (node.node_type !== 'end') {
            // No next node, stay on current node (waiting for response)
            await conversationService.setCurrentNode(
              conversation.id,
              node.id,
              flow.id
            )
          }
          break
        }
      }

      if (iterations >= maxIterations) {
        logger.warn('Max iterations reached in flow execution')
      }
    } catch (error) {
      logger.error('Error executing flow', error)
      await this.sendErrorMessage(accountId, user.phone_number, conversation.id)
    }
  }

  private async sendDefaultMessage(
    accountId: string,
    phoneNumber: string,
    conversationId: string
  ): Promise<void> {
    await messageSender.sendText(
      accountId,
      phoneNumber,
      '¡Hola! Bienvenido a nuestro servicio. Escribe MENU para ver las opciones.',
      conversationId
    )
  }

  private async sendErrorMessage(
    accountId: string,
    phoneNumber: string,
    conversationId: string
  ): Promise<void> {
    await messageSender.sendText(
      accountId,
      phoneNumber,
      'Lo siento, ocurrió un error. Por favor intenta nuevamente o escribe MENU para volver al inicio.',
      conversationId
    )
  }
}

export const flowExecutionService = new FlowExecutionService()
