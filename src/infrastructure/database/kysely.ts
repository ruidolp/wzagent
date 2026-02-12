import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { appConfig } from '../config/app.config'
import type { Database } from './types'

// Create a singleton instance
let kyselyInstance: Kysely<Database> | null = null

export function getDb(): Kysely<Database> {
  if (!kyselyInstance) {
    if (!appConfig.database.url) {
      console.error('[DB] DATABASE_URL is not configured!')
      throw new Error('DATABASE_URL environment variable is required')
    }

    console.log('[DB] Connecting to database:', appConfig.database.url.substring(0, 20) + '...')

    // Parse connection string to update SSL mode
    let connectionString = appConfig.database.url
    if (connectionString.includes('sslmode=require')) {
      // Replace 'require' with 'verify-full' for better security
      connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full')
    }

    const pool = new Pool({
      connectionString: connectionString,
      max: appConfig.database.maxConnections,
    })

    kyselyInstance = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    })
  }

  return kyselyInstance
}

export type KyselyDB = Kysely<Database>
