import { NextRequest, NextResponse } from 'next/server'
import { getFlowsByTenant, createFlow } from '@/infrastructure/database/queries/flows.queries'
import { logger } from '@/infrastructure/utils/logger'

// GET - Get flows for a tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const flows = await getFlowsByTenant(tenantId)

    return NextResponse.json({ flows })
  } catch (error) {
    logger.error('Error getting flows', error)
    return NextResponse.json(
      { error: 'Failed to get flows' },
      { status: 500 }
    )
  }
}

// POST - Create flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, description, triggerType } = body

    if (!tenantId || !name || !triggerType) {
      return NextResponse.json(
        { error: 'tenantId, name, and triggerType are required' },
        { status: 400 }
      )
    }

    const flow = await createFlow({
      tenant_id: tenantId,
      name,
      description: description || null,
      trigger_type: triggerType,
      is_active: true,
      is_default: false,
    })

    return NextResponse.json({ flow })
  } catch (error) {
    logger.error('Error creating flow', error)
    return NextResponse.json(
      { error: 'Failed to create flow' },
      { status: 500 }
    )
  }
}
