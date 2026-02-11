import { getDb } from '../kysely'

export interface ConversationListItem {
  conversation_id: string
  status: string | null
  phone_number: string
  user_name: string | null
  content_text: string | null
  last_message_at: Date | null
  direction: string | null
}

export interface ConversationDetails {
  conversation_id: string
  user_phone: string
  user_name: string | null
  whatsapp_account_id: string
}

/**
 * Get all conversations with their last message for the admin chat list
 */
export async function getConversationsWithLastMessage(
  tenantId: string
): Promise<ConversationListItem[]> {
  const result = await getDb()
    .selectFrom('conversations as c')
    .innerJoin('users as u', 'u.id', 'c.user_id')
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('messages')
          .select(['conversation_id', 'content_text', 'sent_at', 'direction'])
          .distinctOn('conversation_id')
          .orderBy('conversation_id')
          .orderBy('sent_at', 'desc')
          .as('last_msg'),
      (join) => join.onRef('last_msg.conversation_id', '=', 'c.id')
    )
    .select([
      'c.id as conversation_id',
      'c.status',
      'u.phone_number',
      'u.name as user_name',
      'last_msg.content_text',
      'last_msg.sent_at as last_message_at',
      'last_msg.direction',
    ])
    .where('c.tenant_id', '=', tenantId)
    .where('c.deleted_at', 'is', null)
    .orderBy('last_msg.sent_at', 'desc')
    .execute()

  return result as ConversationListItem[]
}

/**
 * Get conversation details needed for sending messages
 */
export async function getConversationDetails(
  conversationId: string
): Promise<ConversationDetails | undefined> {
  const result = await getDb()
    .selectFrom('conversations as c')
    .innerJoin('users as u', 'u.id', 'c.user_id')
    .innerJoin('whatsapp_accounts as wa', 'wa.id', 'c.whatsapp_account_id')
    .select([
      'c.id as conversation_id',
      'u.phone_number as user_phone',
      'u.name as user_name',
      'wa.id as whatsapp_account_id',
    ])
    .where('c.id', '=', conversationId)
    .where('c.deleted_at', 'is', null)
    .executeTakeFirst()

  return result as ConversationDetails | undefined
}
