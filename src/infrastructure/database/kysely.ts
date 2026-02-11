import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { appConfig } from '../config/app.config'
import type { Database } from './types'

// Create a singleton instance
let kyselyInstance: Kysely<Database> | null = null

export function getDb(): Kysely<Database> {
  if (!kyselyInstance) {
    const pool = new Pool({
      connectionString: appConfig.database.url,
      max: appConfig.database.maxConnections,
    })

    kyselyInstance = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    })
  }

  return kyselyInstance
}

export type KyselyDB = Kysely<Database>
