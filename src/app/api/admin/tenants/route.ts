import { NextRequest, NextResponse } from 'next/server'
import {
  getAllTenants,
  createTenant,
} from '@/infrastructure/database/queries/tenants.queries'
import {
  createAccount,
} from '@/infrastructure/database/queries/whatsapp-accounts.queries'
import { generateVerifyToken } from '@/infrastructure/utils/crypto'
import { validateTenantSlug } from '@/infrastructure/utils/validation'
import { logger } from '@/infrastructure/utils/logger'

// GET - List all tenants
export async function GET() {
  try {
    const tenants = await getAllTenants()
    return NextResponse.json({ tenants })
  } catch (error) {
    logger.error('Error getting tenants', error)
    return NextResponse.json(
      { error: 'Failed to get tenants' },
      { status: 500 }
    )
  }
}

// POST - Create tenant with WhatsApp account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      slug,
      phoneNumber,
      phoneNumberId,
      businessAccountId,
      accessToken,
    } = body

    // Validate required fields
    if (!name || !slug || !phoneNumber || !phoneNumberId || !businessAccountId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!validateTenantSlug(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      )
    }

    // Create tenant
    const tenant = await createTenant({
      name,
      slug,
      welcome_message_known: '¡Hola {nombre}! Bienvenido de nuevo 👋',
      welcome_message_new: '¡Hola! Bienvenido 👋 Por favor, dime tu nombre.',
    })

    // Generate verify token
    const verifyToken = generateVerifyToken()

    // Create WhatsApp account
    const account = await createAccount({
      tenant_id: tenant.id,
      phone_number: phoneNumber,
      phone_number_id: phoneNumberId,
      business_account_id: businessAccountId,
      access_token: accessToken,
      webhook_verify_token: verifyToken,
    })

    logger.info('Created tenant and account', {
      tenantId: tenant.id,
      accountId: account.id,
    })

    return NextResponse.json({
      tenant,
      account,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/whatsapp/${tenant.id}`,
      verifyToken,
    })
  } catch (error) {
    logger.error('Error creating tenant', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
