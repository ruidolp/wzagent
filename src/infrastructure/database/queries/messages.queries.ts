import { getDb } from '../kysely'

export async function createMessage(data: {
  conversation_id: string
  tenant_id: string
  whatsapp_message_id?: string
  direction: 'inbound' | 'outbound'
  type: string
  content: Record<string, any>
  content_text?: string
  status?: string
}) {
  return await getDb()
    .insertInto('messages')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function getMessagesByConversation(conversationId: string) {
  return await getDb()
    .selectFrom('messages')
    .selectAll()
    .where('conversation_id', '=', conversationId)
    .where('deleted_at', 'is', null)
    .orderBy('sent_at', 'asc')
    .execute()
}

export async function updateMessageStatus(
  whatsappMessageId: string,
  status: string
) {
  return await getDb()
    .updateTable('messages')
    .set({ status })
    .where('whatsapp_message_id', '=', whatsappMessageId)
    .execute()
}

export async function searchMessages(
  tenantId: string,
  searchTerm: string,
  limit: number = 50
) {
  return await getDb()
    .selectFrom('messages')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('deleted_at', 'is', null)
    .where((eb) =>
      eb('content_text', 'ilike', `%${searchTerm}%`)
    )
    .orderBy('sent_at', 'desc')
    .limit(limit)
    .execute()
}
