import { NextResponse } from 'next/server'
import { getRecentWebhookLogs } from '@/infrastructure/database/queries/webhook-logs.queries'
import { logger } from '@/infrastructure/utils/logger'

// GET - Get recent webhook logs
export async function GET() {
  try {
    const logs = await getRecentWebhookLogs(50) // Get last 50 logs
    return NextResponse.json({ logs })
  } catch (error) {
    logger.error('Error getting webhook logs', error)
    return NextResponse.json(
      { error: 'Failed to get webhook logs' },
      { status: 500 }
    )
  }
}
