import { getDb } from '../kysely'
import type { Tenants } from '../types'

export async function getTenantById(id: string) {
  return await getDb()
    .selectFrom('tenants')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function getTenantBySlug(slug: string) {
  return await getDb()
    .selectFrom('tenants')
    .selectAll()
    .where('slug', '=', slug)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function getAllTenants() {
  return await getDb()
    .selectFrom('tenants')
    .selectAll()
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .execute()
}

export async function createTenant(data: {
  name: string
  slug: string
  session_timeout_minutes?: number
  welcome_message_known?: string
  welcome_message_new?: string
  timezone?: string
}) {
  const result = await getDb()
    .insertInto('tenants')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()

  return result
}

export async function updateTenant(
  id: string,
  data: any
) {
  return await getDb()
    .updateTable('tenants')
    .set(data)
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

export async function deleteTenant(id: string) {
  return await getDb()
    .updateTable('tenants')
    .set({ deleted_at: new Date() })
    .where('id', '=', id)
    .execute()
}
