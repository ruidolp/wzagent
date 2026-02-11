import { getDb } from '../kysely'
import type { FlowNodes } from '../types'

export async function getNodeById(id: string) {
  return await getDb()
    .selectFrom('flow_nodes')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}

export async function getNodesByFlow(flowId: string) {
  return await getDb()
    .selectFrom('flow_nodes')
    .selectAll()
    .where('flow_id', '=', flowId)
    .orderBy('created_at', 'asc')
    .execute()
}

export async function getRootNodes(flowId: string) {
  return await getDb()
    .selectFrom('flow_nodes')
    .selectAll()
    .where('flow_id', '=', flowId)
    .where('parent_node_id', 'is', null)
    .execute()
}

export async function createNode(data: {
  flow_id: string
  parent_node_id?: string
  node_type: string
  config: Record<string, any>
  transitions?: Record<string, any>
  position?: Record<string, any>
}) {
  return await getDb()
    .insertInto('flow_nodes')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateNode(
  id: string,
  data: any
) {
  return await getDb()
    .updateTable('flow_nodes')
    .set(data)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}
