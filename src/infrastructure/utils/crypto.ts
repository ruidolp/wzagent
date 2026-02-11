import crypto from 'crypto'

export function generateVerifyToken(): string {
  return crypto.randomUUID()
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')

  return `sha256=${expectedSignature}` === signature
}

export function generateWebhookSignature(
  payload: string,
  appSecret: string
): string {
  return crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')
}
