export const appConfig = {
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    maxConnections: 10,
  },

  // App
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
  },

  // Logging
  logging: {
    webhookLogging: process.env.ENABLE_WEBHOOK_LOGGING === 'true',
    debugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
  },

  // WhatsApp
  whatsapp: {
    apiVersion: 'v21.0',
    apiBaseUrl: 'https://graph.facebook.com',
    sessionTimeoutMinutes: 30,
  },
} as const

export type AppConfig = typeof appConfig
