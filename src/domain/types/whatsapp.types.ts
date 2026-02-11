// WhatsApp Cloud API Types (Meta)

export interface WhatsAppWebhookEntry {
  id: string
  changes: WhatsAppWebhookChange[]
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue
  field: string
}

export interface WhatsAppWebhookValue {
  messaging_product: string
  metadata: WhatsAppMetadata
  contacts?: WhatsAppContact[]
  messages?: WhatsAppIncomingMessage[]
  statuses?: WhatsAppMessageStatus[]
}

export interface WhatsAppMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface WhatsAppContact {
  profile: {
    name: string
  }
  wa_id: string
}

export interface WhatsAppIncomingMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'interactive' | 'image' | 'video' | 'document' | 'audio'
  text?: {
    body: string
  }
  interactive?: {
    type: 'list_reply' | 'button_reply'
    list_reply?: {
      id: string
      title: string
      description?: string
    }
    button_reply?: {
      id: string
      title: string
    }
  }
  image?: {
    id: string
    mime_type: string
    sha256: string
    caption?: string
  }
  context?: {
    from: string
    id: string
  }
}

export interface WhatsAppMessageStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: any[]
}

// Outgoing message types
export interface WhatsAppTextMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text'
  text: {
    preview_url?: boolean
    body: string
  }
  context?: {
    message_id: string
  }
}

export interface WhatsAppInteractiveMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'interactive'
  interactive: WhatsAppInteractive
  context?: {
    message_id: string
  }
}

export interface WhatsAppInteractive {
  type: 'list' | 'button'
  header?: {
    type: 'text'
    text: string
  }
  body: {
    text: string
  }
  footer?: {
    text: string
  }
  action: WhatsAppInteractiveAction
}

export interface WhatsAppInteractiveAction {
  button?: string
  buttons?: WhatsAppButton[]
  sections?: WhatsAppSection[]
}

export interface WhatsAppButton {
  type: 'reply'
  reply: {
    id: string
    title: string
  }
}

export interface WhatsAppSection {
  title?: string
  rows: WhatsAppRow[]
}

export interface WhatsAppRow {
  id: string
  title: string
  description?: string
}

// API Response
export interface WhatsAppApiResponse {
  messaging_product: string
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

export interface WhatsAppApiError {
  error: {
    message: string
    type: string
    code: number
    error_data?: any
    error_subcode?: number
    fbtrace_id: string
  }
}
