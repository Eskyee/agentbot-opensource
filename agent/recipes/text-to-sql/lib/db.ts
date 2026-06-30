import { createClient } from '@libsql/client'

/**
 * Database client. Defaults to a local SQLite file; point DATABASE_URL at a
 * remote Turso/libSQL database, or swap the client for Postgres/MySQL.
 */
export const db = createClient({
  url: process.env.DATABASE_URL ?? 'file:data.db',
})
