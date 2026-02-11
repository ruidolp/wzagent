import type { WhatsAppInteractive } from './whatsapp.types'

// Unified message payload for internal use
export interface MessagePayload {
  to: string
  type: 'text' | 'interactive' | 'image' | 'video' | 'document'
  content: TextContent | InteractiveContent | MediaContent
  context?: {
    messageId: string
  }
}

export interface TextContent {
  text: string
  previewUrl?: boolean
}

export interface InteractiveContent {
  interactive: WhatsAppInteractive
}

export interface MediaContent {
  id?: string
  link?: string
  caption?: string
  filename?: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}
