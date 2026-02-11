import { NextRequest, NextResponse } from 'next/server'
import { getConversationsWithLastMessage } from '@/infrastructure/database/queries/admin-chats.queries'
import { logger } from '@/infrastructure/utils/logger'

// GET - List all conversations for a tenant
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

    const conversations = await getConversationsWithLastMessage(tenantId)

    return NextResponse.json({ conversations })
  } catch (error) {
    logger.error('Error getting conversations', error)
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    )
  }
}
