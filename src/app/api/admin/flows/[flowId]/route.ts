import { NextRequest, NextResponse } from 'next/server'
import { getFlowById, updateFlow } from '@/infrastructure/database/queries/flows.queries'
import { getNodesByFlow, createNode, updateNode } from '@/infrastructure/database/queries/flow-nodes.queries'
import { logger } from '@/infrastructure/utils/logger'
import { getDb } from '@/infrastructure/database/kysely'

// GET - Get flow with nodes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params

    const flow = await getFlowById(flowId)
    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      )
    }

    const nodes = await getNodesByFlow(flowId)

    return NextResponse.json({ flow, nodes })
  } catch (error) {
    logger.error('Error getting flow', error)
    return NextResponse.json(
      { error: 'Failed to get flow' },
      { status: 500 }
    )
  }
}

// PATCH - Update flow
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params
    const body = await request.json()

    const { name, description, isActive, nodes, edges } = body

    // Update flow
    const flow = await updateFlow(flowId, {
      name,
      description,
      is_active: isActive,
    })

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      )
    }

    // Update nodes if provided
    if (nodes && Array.isArray(nodes)) {
      // Build transitions from edges
      const transitionsMap = buildTransitionsFromEdges(nodes, edges || [])

      // Identify root node (no incoming connections)
      const rootNodeId = findRootNode(nodes, edges || [])

      // Delete all existing nodes first
      await getDb()
        .deleteFrom('flow_nodes')
        .where('flow_id', '=', flowId)
        .execute()

      // Create new nodes with proper structure
      const nodeIdMapping: Record<string, string> = {}

      for (const node of nodes) {
        const isRoot = node.id === rootNodeId
        const config = processNodeConfig(node, transitionsMap[node.id] || {})

        const nodeData: any = {
          flow_id: flowId,
          node_type: node.type,
          config,
          transitions: transitionsMap[node.id] || {},
          position: { x: node.position.x, y: node.position.y },
        }

        // Only set parent_node_id for non-root nodes
        if (!isRoot) {
          nodeData.parent_node_id = null
        }

        const createdNode = await createNode(nodeData)

        nodeIdMapping[node.id] = createdNode.id
      }

      // Update transitions and config with real database IDs
      for (const [oldId, newId] of Object.entries(nodeIdMapping)) {
        const node = nodes.find(n => n.id === oldId)
        if (!node) continue

        const transitions = transitionsMap[oldId]
        if (!transitions || Object.keys(transitions).length === 0) continue

        // Map old IDs to new IDs in transitions
        const updatedTransitions: Record<string, string> = {}
        for (const [key, targetOldId] of Object.entries(transitions)) {
          const targetNewId = nodeIdMapping[targetOldId as string]
          if (targetNewId) {
            updatedTransitions[key] = targetNewId
          }
        }

        // Update config with real IDs for options/buttons
        const updatedConfig = updateConfigWithRealIds(node, nodeIdMapping)

        // Update node with real transitions and config
        await updateNode(newId, {
          transitions: updatedTransitions,
          config: updatedConfig,
        })
      }
    }

    return NextResponse.json({ flow })
  } catch (error) {
    logger.error('Error updating flow', error)
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    )
  }
}

// Helper: Build transitions map from edges
function buildTransitionsFromEdges(
  nodes: any[],
  edges: any[]
): Record<string, Record<string, string>> {
  const transitionsMap: Record<string, Record<string, string>> = {}

  // Initialize all nodes
  nodes.forEach(node => {
    transitionsMap[node.id] = {}
  })

  // Process edges
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    if (!sourceNode) return

    const nodeType = sourceNode.type

    // For menu and buttons, we need to match edges to options
    if (nodeType === 'menu' || nodeType === 'buttons') {
      // The edge label should match the option ID
      const optionId = edge.sourceHandle || edge.label || 'default'
      transitionsMap[edge.source][optionId] = edge.target
    } else {
      // For other nodes, use 'default' transition
      transitionsMap[edge.source]['default'] = edge.target
    }
  })

  return transitionsMap
}

// Helper: Find root node (no incoming edges)
function findRootNode(nodes: any[], edges: any[]): string | null {
  const nodesWithIncoming = new Set(edges.map(e => e.target))
  const rootNode = nodes.find(n => !nodesWithIncoming.has(n.id))
  return rootNode ? rootNode.id : (nodes[0]?.id || null)
}

// Helper: Process node config to add nextNodeId to options
function processNodeConfig(
  node: any,
  transitions: Record<string, string>
): Record<string, any> {
  const config = { ...node.data.config }

  if (node.type === 'menu' && config.options) {
    // Add nextNodeId to each option based on transitions
    config.options = config.options.map((option: any) => ({
      ...option,
      nextNodeId: transitions[option.id] || transitions['default'] || '',
    }))
  }

  if (node.type === 'buttons' && config.buttons) {
    // Add nextNodeId to each button based on transitions
    config.buttons = config.buttons.map((button: any) => ({
      ...button,
      nextNodeId: transitions[button.id] || transitions['default'] || '',
    }))
  }

  return config
}

// Helper: Update config with real database IDs
function updateConfigWithRealIds(
  node: any,
  nodeIdMapping: Record<string, string>
): Record<string, any> {
  const config = { ...node.data.config }

  if (node.type === 'menu' && config.options) {
    config.options = config.options.map((option: any) => {
      const oldNextNodeId = option.nextNodeId
      const newNextNodeId = oldNextNodeId ? nodeIdMapping[oldNextNodeId] : undefined
      return {
        ...option,
        nextNodeId: newNextNodeId || oldNextNodeId || '',
      }
    })
  }

  if (node.type === 'buttons' && config.buttons) {
    config.buttons = config.buttons.map((button: any) => {
      const oldNextNodeId = button.nextNodeId
      const newNextNodeId = oldNextNodeId ? nodeIdMapping[oldNextNodeId] : undefined
      return {
        ...button,
        nextNodeId: newNextNodeId || oldNextNodeId || '',
      }
    })
  }

  return config
}

// DELETE - Soft delete flow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params

    const flow = await updateFlow(flowId, {
      deleted_at: new Date(),
      is_active: false,
    })

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting flow', error)
    return NextResponse.json(
      { error: 'Failed to delete flow' },
      { status: 500 }
    )
  }
}
