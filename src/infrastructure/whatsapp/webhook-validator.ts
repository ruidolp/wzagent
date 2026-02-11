import { verifyWebhookSignature } from '../utils/crypto'
import { logger } from '../utils/logger'

export class WebhookValidator {
  validateVerifyToken(
    providedToken: string,
    storedToken: string
  ): boolean {
    return providedToken === storedToken
  }

  validateSignature(
    payload: string,
    signature: string | null,
    appSecret: string
  ): boolean {
    if (!signature) {
      logger.warn('No signature provided in webhook request')
      return false
    }

    return verifyWebhookSignature(payload, signature, appSecret)
  }

  validateWebhookChallenge(
    mode: string | null,
    challenge: string | null
  ): boolean {
    return mode === 'subscribe' && challenge !== null
  }
}

export const webhookValidator = new WebhookValidator()
