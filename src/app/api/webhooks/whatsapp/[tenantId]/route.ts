import { NextRequest, NextResponse } from 'next/server'
import { webhookValidator } from '@/infrastructure/whatsapp/webhook-validator'
import { webhookHandler } from '@/infrastructure/whatsapp/webhook-handler'
import { getAccountByPhoneNumberId } from '@/infrastructure/database/queries/whatsapp-accounts.queries'
import { logger } from '@/infrastructure/utils/logger'

// GET - Webhook verification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    const searchParams = request.nextUrl.searchParams

    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    logger.info('Webhook verification request', { tenantId, mode })

    // Validate webhook challenge
    if (!webhookValidator.validateWebhookChallenge(mode, challenge)) {
      logger.warn('Invalid webhook challenge')
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Validate verify token
    // Note: In production, you should fetch the account by tenantId and validate
    // For now, we just validate that the token exists
    if (!token) {
      logger.warn('No verify token provided')
      return NextResponse.json({ error: 'No verify token' }, { status: 403 })
    }

    logger.info('Webhook verified successfully', { tenantId })

    // Return challenge to complete verification
    return new NextResponse(challenge, { status: 200 })
  } catch (error) {
    logger.error('Webhook verification error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Receive webhook events
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    const body = await request.json()

    // Enhanced logging for webhook received
    console.log('🔔 ===============================================')
    console.log('🔔 WEBHOOK RECEIVED from Meta WhatsApp')
    console.log('🔔 ===============================================')
    console.log(`📱 Tenant ID: ${tenantId}`)
    console.log(`📦 Body:`, JSON.stringify(body, null, 2))
    console.log('🔔 ===============================================')

    logger.info('Webhook POST received', {
      tenantId,
      hasMessages: body.entry?.[0]?.changes?.[0]?.value?.messages?.length > 0,
      hasStatuses: body.entry?.[0]?.changes?.[0]?.value?.statuses?.length > 0,
    })

    // Get headers
    const signature = request.headers.get('x-hub-signature-256')
    const headers: Record<string, any> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Note: Signature validation would require app secret per tenant
    // For MVP, we skip this but log the signature
    if (signature) {
      logger.debug('Webhook signature received', { signature: signature.substring(0, 20) })
    }

    // Process webhook synchronously
    // Meta expects a response within 20 seconds, which is enough time
    try {
      await webhookHandler.processWebhook(tenantId, body, headers)
    } catch (error) {
      logger.error('Webhook processing error', error)
      // Still return 200 to avoid Meta retries
    }

    // Respond with 200 OK after processing
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error('Webhook POST error', error)

    // Still return 200 to avoid Meta retries
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
