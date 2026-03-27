/**
 * Vector Search Utilities for Agentbot
 *
 * Wraps pgvector operations for semantic similarity search.
 * Falls back gracefully if pgvector extension is not installed.
 */

import { prisma } from '@/app/lib/prisma';

const EMBEDDING_DIM = 1536; // text-embedding-3-small dimension

/**
 * Check if pgvector extension is available in the database.
 */
export async function isVectorSearchAvailable(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists
    `;
    return result[0]?.exists ?? false;
  } catch {
    return false;
  }
}

/**
 * Perform cosine similarity search against a table with an embedding column.
 *
 * @param table - Table name (e.g., '"Skill"')
 * @param embedding - Query embedding vector
 * @param options - Search options
 */
export async function similaritySearch(
  table: string,
  embedding: number[],
  options: {
    select?: string;
    where?: string;
    limit?: number;
    threshold?: number;
  } = {}
): Promise<Record<string, unknown>[]> {
  const { select = '*', limit = 10, threshold = 0.5 } = options;

  const vectorStr = `[${embedding.join(',')}]`;

  try {
    const results = await prisma.$queryRawUnsafe(
      `
      SELECT ${select},
             1 - (embedding <=> $1::vector) as similarity
      FROM ${table}
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> $1::vector) > $2
        ${options.where ? `AND ${options.where}` : ''}
      ORDER BY embedding <=> $1::vector
      LIMIT $3
      `,
      vectorStr,
      threshold,
      limit
    );
    return results as Record<string, unknown>[];
  } catch (err) {
    console.error('Vector search failed:', err);
    return [];
  }
}

/**
 * Store an embedding vector for a record.
 */
export async function storeEmbedding(
  table: string,
  id: string,
  embedding: number[]
): Promise<void> {
  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    id
  );
}

export { EMBEDDING_DIM };
