import { NextRequest, NextResponse } from 'next/server'
import { getFlowsByTenant } from '@/infrastructure/database/queries/flows.queries'
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
