import { getDb } from '../kysely'
import { sql } from 'kysely'
import type { Flows } from '../types'

export async function getFlowById(id: string) {
  return await getDb()
    .selectFrom('flows')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function getFlowByTrigger(
  tenantId: string,
  triggerType: string,
  keyword?: string
) {
  let query = getDb()
    .selectFrom('flows')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('trigger_type', '=', triggerType)
    .where('is_active', '=', true)
    .where('deleted_at', 'is', null)

  if (keyword) {
    query = query.where(sql`trigger_keywords @> ARRAY[${keyword}]::text[]` as any)
  }

  return await query.executeTakeFirst()
}

export async function getDefaultFlow(tenantId: string) {
  return await getDb()
    .selectFrom('flows')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('is_default', '=', true)
    .where('is_active', '=', true)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function createFlow(data: {
  tenant_id: string
  whatsapp_account_id?: string
  name: string
  description?: string
  trigger_type: string
  trigger_keywords?: string[]
  is_default?: boolean
  is_active?: boolean
}) {
  return await getDb()
    .insertInto('flows')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateFlow(
  id: string,
  data: any
) {
  return await getDb()
    .updateTable('flows')
    .set(data)
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

export async function getFlowsByTenant(tenantId: string) {
  return await getDb()
    .selectFrom('flows')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('is_active', '=', true)
    .where('deleted_at', 'is', null)
    .orderBy('name', 'asc')
    .execute()
}
