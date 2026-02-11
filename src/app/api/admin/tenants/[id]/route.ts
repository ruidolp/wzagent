import { NextRequest, NextResponse } from 'next/server'
import { getTenantById, updateTenant } from '@/infrastructure/database/queries/tenants.queries'
import { getAccountsByTenant, updateAccount } from '@/infrastructure/database/queries/whatsapp-accounts.queries'
import { logger } from '@/infrastructure/utils/logger'

// GET - Get tenant with WhatsApp accounts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tenant = await getTenantById(id)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const accounts = await getAccountsByTenant(id)

    return NextResponse.json({ tenant, accounts })
  } catch (error) {
    logger.error('Error getting tenant', error)
    return NextResponse.json(
      { error: 'Failed to get tenant' },
      { status: 500 }
    )
  }
}

// PATCH - Update tenant and WhatsApp account
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { name, accountId, accessToken, phoneNumberId, businessAccountId } = body

    // Update tenant if name provided
    if (name) {
      await updateTenant(id, { name })
    }

    // Update WhatsApp account if provided
    if (accountId && (accessToken || phoneNumberId || businessAccountId)) {
      const updateData: any = {}
      if (accessToken) updateData.access_token = accessToken
      if (phoneNumberId) updateData.phone_number_id = phoneNumberId
      if (businessAccountId) updateData.business_account_id = businessAccountId

      await updateAccount(accountId, updateData)
    }

    const tenant = await getTenantById(id)
    const accounts = await getAccountsByTenant(id)

    logger.info('Updated tenant', { tenantId: id })

    return NextResponse.json({ tenant, accounts })
  } catch (error) {
    logger.error('Error updating tenant', error)
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}
