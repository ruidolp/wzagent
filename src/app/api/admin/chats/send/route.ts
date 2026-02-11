import { NextRequest, NextResponse } from 'next/server'
import { getConversationDetails } from '@/infrastructure/database/queries/admin-chats.queries'
import { messageSender } from '@/infrastructure/messaging/message-sender'
import { logger } from '@/infrastructure/utils/logger'

// POST - Send a message to a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, message } = body

    // Validate input
    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'conversationId and message are required' },
        { status: 400 }
      )
    }

    // Validate message length (WhatsApp limit is 4096 characters)
    if (message.length > 4096) {
      return NextResponse.json(
        { error: 'Message too long (max 4096 characters)' },
        { status: 400 }
      )
    }

    // Get conversation details
    const conversation = await getConversationDetails(conversationId)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Send message via WhatsApp
    const result = await messageSender.sendText(
      conversation.whatsapp_account_id,
      conversation.user_phone,
      message,
      conversationId
    )

    if (!result.success) {
      logger.error('Failed to send message', { error: result.error })
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    logger.error('Error sending message', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
