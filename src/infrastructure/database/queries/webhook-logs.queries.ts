import { getDb } from '../kysely'

export async function createWebhookLog(data: {
  tenant_id?: string
  method: string
  headers?: Record<string, any>
  body?: Record<string, any>
  response_status?: number
  error?: string
}) {
  return await getDb()
    .insertInto('webhook_logs')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function getWebhookLogs(
  tenantId: string,
  limit: number = 100
) {
  return await getDb()
    .selectFrom('webhook_logs')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute()
}

export async function getRecentWebhookLogs(limit: number = 50) {
  return await getDb()
    .selectFrom('webhook_logs')
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute()
}
