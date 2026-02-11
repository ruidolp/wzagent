import { getDb } from '../kysely'
import type { WhatsappAccounts } from '../types'

export async function getAccountById(id: string) {
  return await getDb()
    .selectFrom('whatsapp_accounts')
    .selectAll()
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function getAccountByPhoneNumberId(phoneNumberId: string) {
  return await getDb()
    .selectFrom('whatsapp_accounts')
    .selectAll()
    .where('phone_number_id', '=', phoneNumberId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

export async function getAccountsByTenant(tenantId: string) {
  return await getDb()
    .selectFrom('whatsapp_accounts')
    .selectAll()
    .where('tenant_id', '=', tenantId)
    .where('deleted_at', 'is', null)
    .execute()
}

export async function createAccount(data: {
  tenant_id: string
  phone_number: string
  phone_number_id: string
  business_account_id: string
  access_token: string
  webhook_verify_token: string
}) {
  return await getDb()
    .insertInto('whatsapp_accounts')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateAccount(
  id: string,
  data: any
) {
  return await getDb()
    .updateTable('whatsapp_accounts')
    .set(data)
    .where('id', '=', id)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}
