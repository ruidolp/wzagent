import { NextRequest, NextResponse } from 'next/server'
import { getConversationDetails } from '@/infrastructure/database/queries/admin-chats.queries'
import { getMessagesByConversation } from '@/infrastructure/database/queries/messages.queries'
import { logger } from '@/infrastructure/utils/logger'

// GET - Get messages for a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    // Get conversation details and messages in parallel
    const [conversation, messages] = await Promise.all([
      getConversationDetails(conversationId),
      getMessagesByConversation(conversationId),
    ])

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation, messages })
  } catch (error) {
    logger.error('Error getting messages', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}
