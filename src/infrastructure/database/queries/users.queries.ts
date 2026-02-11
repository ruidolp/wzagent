import { getDb } from '../kysely'
import type { Users } from '../types'

export async function getUserById(id: string) {
  return await getDb()
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function getUserByPhone(tenantId: string, phoneNumber: string) {
  return await getDb()
    .selectFrom('users')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('phone_number', '=', phoneNumber)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function createUser(data: {
  tenant_id: string
  phone_number: string
  name?: string
  email?: string
  metadata?: Record<string, any>
}) {
  return await getDb()
    .insertInto('users')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateUser(
  id: string,
  data: any
) {
  return await getDb()
    .updateTable('users')
    .set(data)
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

export async function isUserKnown(tenantId: string, phoneNumber: string): Promise<boolean> {
  const user = await getUserByPhone(tenantId, phoneNumber)
  return user !== undefined && user.name !== null
}
