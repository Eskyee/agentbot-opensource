/**
 * Shared pg connection pool — single source of truth for the API process.
 *
 * Previously every service / route created its own `new Pool()`, which meant
 * a single backend process could open dozens of independent pools and chew
 * through Postgres' connection budget in a way no single config could see.
 * This module owns the one pool everyone shares.
 *
 * Pool size is intentionally larger than any previous individual pool to
 * cover all consumers, and idle/connection timeouts mirror the ones db-init.ts
 * used so failures still surface fast on a misconfigured DATABASE_URL.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                       // single shared pool, sized for all consumers
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Catch idle client errors — don't crash, pool reconnects automatically.
pool.on('error', (err) => {
  console.error('[DB] Idle client error (non-fatal):', err.message);
});

export { pool };

/**
 * Pool health stats for monitoring / /health endpoint.
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}
