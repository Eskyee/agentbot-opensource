/**
 * Search Utility for Agentbot
 *
 * Unified search across agents, skills, workflows, and memories.
 * Supports:
 *   - PostgreSQL full-text search (via raw queries)
 *   - Semantic/vector search (via OpenAI embeddings)
 *   - Hybrid scoring combining both
 *
 * Adapted from SelfClaw search-projects pattern for Agentbot's data model.
 */

import { prisma } from '@/app/lib/prisma';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  type: 'agent' | 'skill' | 'workflow' | 'memory';
  name: string;
  description: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  query: string;
  types?: Array<'agent' | 'skill' | 'workflow' | 'memory'>;
  userId?: string;
  limit?: number;
  threshold?: number;
}

// ─── Full-Text Search ──────────────────────────────────────────────────────────

/**
 * PostgreSQL full-text search across all entity types.
 * Uses plainto_tsquery for natural language queries.
 */
export async function fullTextSearch(
  query: string,
  options: { types?: string[]; userId?: string; limit?: number } = {}
): Promise<SearchResult[]> {
  const { types, userId, limit = 20 } = options;
  const results: SearchResult[] = [];

  const tsQuery = query.trim();
  if (!tsQuery) return results;

  // Search skills (has description field)
  if (!types || types.includes('skill')) {
    const skills = await prisma.$queryRaw<
      Array<{ id: string; name: string; description: string; rank: number }>
    >`
      SELECT id, name, description,
             ts_rank(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '')),
                    plainto_tsquery('english', ${tsQuery})) as rank
      FROM "Skill"
      WHERE to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))
            @@ plainto_tsquery('english', ${tsQuery})
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    for (const s of skills) {
      results.push({
        id: s.id,
        type: 'skill',
        name: s.name,
        description: s.description,
        score: Number(s.rank),
        metadata: {},
      });
    }
  }

  // Search agents
  if (!types || types.includes('agent')) {
    const agents = await prisma.$queryRaw<
      Array<{ id: string; name: string; rank: number }>
    >`
      SELECT id, name,
             ts_rank(to_tsvector('english', coalesce(name, '')),
                    plainto_tsquery('english', ${tsQuery})) as rank
      FROM "Agent"
      ${userId ? prisma.$queryRaw`WHERE "userId" = ${userId}` : prisma.$queryRaw``}
      ${userId ? prisma.$queryRaw`` : prisma.$queryRaw`WHERE to_tsvector('english', coalesce(name, '')) @@ plainto_tsquery('english', ${tsQuery})`}
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    for (const a of agents) {
      results.push({
        id: a.id,
        type: 'agent',
        name: a.name,
        description: '',
        score: Number(a.rank),
        metadata: {},
      });
    }
  }

  // Search workflows
  if (!types || types.includes('workflow')) {
    const where: Record<string, unknown> = {
      OR: [
        { name: { contains: tsQuery, mode: 'insensitive' } },
        { description: { contains: tsQuery, mode: 'insensitive' } },
      ],
    };
    if (userId) where.userId = userId;

    const workflows = await prisma.workflow.findMany({
      where,
      take: limit,
      select: { id: true, name: true, description: true },
    });

    for (const w of workflows) {
      results.push({
        id: w.id,
        type: 'workflow',
        name: w.name,
        description: w.description || '',
        score: 0.5,
        metadata: {},
      });
    }
  }

  // Search memories
  if (!types || types.includes('memory')) {
    const where: Record<string, unknown> = {
      OR: [
        { key: { contains: tsQuery, mode: 'insensitive' } },
        { value: { contains: tsQuery, mode: 'insensitive' } },
      ],
    };
    if (userId) where.userId = userId;

    const memories = await prisma.agentMemory.findMany({
      where,
      take: limit,
      select: { id: true, key: true, value: true, agentId: true },
    });

    for (const m of memories) {
      results.push({
        id: m.id,
        type: 'memory',
        name: m.key,
        description: m.value.substring(0, 200),
        score: 0.3,
        metadata: { agentId: m.agentId },
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ─── Semantic Search (Embeddings) ──────────────────────────────────────────────

/**
 * Generate an embedding vector for a search query using OpenAI.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Semantic vector search using pgvector cosine similarity.
 * Requires the pgvector extension and an `embedding` column on target tables.
 */
export async function vectorSearch(
  embedding: number[],
  options: { types?: string[]; limit?: number; threshold?: number } = {}
): Promise<SearchResult[]> {
  const { limit = 20, threshold = 0.7 } = options;
  const results: SearchResult[] = [];

  const vectorStr = `[${embedding.join(',')}]`;

  // Search skills with embeddings (if pgvector extension is available)
  try {
    const skills = await prisma.$queryRaw<
      Array<{ id: string; name: string; description: string; similarity: number }>
    >`
      SELECT id, name, description,
             1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM "Skill"
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${vectorStr}::vector) > ${threshold}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    for (const s of skills) {
      results.push({
        id: s.id,
        type: 'skill',
        name: s.name,
        description: s.description,
        score: Number(s.similarity),
        metadata: {},
      });
    }
  } catch {
    // pgvector not available, skip vector search
  }

  return results;
}

// ─── Hybrid Search ─────────────────────────────────────────────────────────────

/**
 * Hybrid search combining full-text and vector search results.
 * Deduplicates and re-ranks using Reciprocal Rank Fusion (RRF).
 */
export async function hybridSearch(
  options: SearchOptions
): Promise<SearchResult[]> {
  const { query, types, userId, limit = 20, threshold = 0.5 } = options;

  // Run both searches in parallel
  const [ftsResults, vecResults] = await Promise.all([
    fullTextSearch(query, { types, userId, limit: limit * 2 }),
    (async () => {
      try {
        const embedding = await generateEmbedding(query);
        return await vectorSearch(embedding, { types, limit: limit * 2, threshold });
      } catch {
        return [];
      }
    })(),
  ]);

  // Reciprocal Rank Fusion (k=60)
  const k = 60;
  const scoreMap = new Map<string, { result: SearchResult; ftsRank: number; vecRank: number }>();

  ftsResults.forEach((r, i) => {
    const key = `${r.type}:${r.id}`;
    scoreMap.set(key, { result: r, ftsRank: i + 1, vecRank: Infinity });
  });

  vecResults.forEach((r, i) => {
    const key = `${r.type}:${r.id}`;
    const existing = scoreMap.get(key);
    if (existing) {
      existing.vecRank = i + 1;
    } else {
      scoreMap.set(key, { result: r, ftsRank: Infinity, vecRank: i + 1 });
    }
  });

  // Calculate RRF scores
  const fused = Array.from(scoreMap.values()).map(({ result, ftsRank, vecRank }) => ({
    ...result,
    score:
      (ftsRank !== Infinity ? 1 / (k + ftsRank) : 0) +
      (vecRank !== Infinity ? 1 / (k + vecRank) : 0),
  }));

  return fused.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ─── Embedding Management ──────────────────────────────────────────────────────

/**
 * Generate and store embeddings for a skill's description.
 * Call this when skills are created or updated.
 */
export async function embedSkill(skillId: string): Promise<void> {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { name: true, description: true, category: true },
  });

  if (!skill) return;

  const text = `${skill.name} ${skill.description} ${skill.category}`;
  const embedding = await generateEmbedding(text);

  // Store via raw query (embedding column may not exist in Prisma schema yet)
  await prisma.$executeRaw`
    UPDATE "Skill" SET embedding = ${`[${embedding.join(',')}]`}::vector
    WHERE id = ${skillId}
  `;
}

/**
 * Batch embed all skills that don't have embeddings yet.
 */
export async function backfillEmbeddings(batchSize = 50): Promise<number> {
  const skills = await prisma.$queryRaw<
    Array<{ id: string; name: string; description: string; category: string }>
  >`
    SELECT id, name, description, category FROM "Skill"
    WHERE embedding IS NULL
    LIMIT ${batchSize}
  `;

  let count = 0;
  for (const skill of skills) {
    try {
      const text = `${skill.name} ${skill.description} ${skill.category}`;
      const embedding = await generateEmbedding(text);
      await prisma.$executeRaw`
        UPDATE "Skill" SET embedding = ${`[${embedding.join(',')}]`}::vector
        WHERE id = ${skill.id}
      `;
      count++;
    } catch (err) {
      console.error(`Failed to embed skill ${skill.id}:`, err);
    }
  }

  return count;
}
