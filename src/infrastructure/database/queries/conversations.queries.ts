import { getDb } from '../kysely'
import type { Conversations } from '../types'

export async function getConversationById(id: string) {
  return await getDb()
    .selectFrom('conversations')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function getActiveConversation(userId: string) {
  const now = new Date()

  return await getDb()
    .selectFrom('conversations')
    .selectAll()
    .where('user_id', '=', userId)
    .where('status', '=', 'active')
    .where('deleted_at', 'is', null)
    .where((eb) => eb.or([
      eb('session_expires_at', 'is', null),
      eb('session_expires_at', '>', now)
    ]))
    .executeTakeFirst()
}

export async function createConversation(data: {
  tenant_id: string
  whatsapp_account_id: string
  user_id: string
  active_flow_id?: string
  current_node_id?: string
  session_expires_at?: Date
  context?: Record<string, any>
}) {
  return await getDb()
    .insertInto('conversations')
    .values({
      ...data,
      status: 'active',
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateConversation(
  id: string,
  data: any
) {
  return await getDb()
    .updateTable('conversations')
    .set(data)
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

export async function updateConversationContext(
  id: string,
  context: Record<string, any>
) {
  return await getDb()
    .updateTable('conversations')
    .set({ context })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function endConversation(id: string) {
  return await getDb()
    .updateTable('conversations')
    .set({ status: 'completed' })
    .where('id', '=', id)
    .execute()
}
