/**
 * Search API Endpoint
 *
 * GET /api/query?q=search+term&type=agent,skill,workflow,memory&limit=20&mode=hybrid
 *
 * Modes:
 *   - fts: PostgreSQL full-text search only
 *   - vector: Semantic vector search only
 *   - hybrid: Combined FTS + vector (default)
 *
 * Adapted from SelfClaw search-projects pattern for Agentbot's data model.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { fullTextSearch, vectorSearch, hybridSearch, generateEmbedding } from '@/lib/search';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const typesParam = searchParams.get('type');
    const types = typesParam
      ? (typesParam.split(',') as Array<'agent' | 'skill' | 'workflow' | 'memory'>)
      : undefined;

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const mode = searchParams.get('mode') || 'hybrid';
    const threshold = parseFloat(searchParams.get('threshold') || '0.5');

    let results;

    switch (mode) {
      case 'fts':
        results = await fullTextSearch(query, {
          types,
          userId: session?.user?.id,
          limit,
        });
        break;

      case 'vector':
        try {
          const embedding = await generateEmbedding(query);
          results = await vectorSearch(embedding, { types, limit, threshold });
        } catch (err) {
          return NextResponse.json(
            { error: 'Vector search unavailable. Check OPENAI_API_KEY.' },
            { status: 503 }
          );
        }
        break;

      case 'hybrid':
      default:
        results = await hybridSearch({
          query,
          types,
          userId: session?.user?.id,
          limit,
          threshold,
        });
        break;
    }

    return NextResponse.json({
      query,
      mode,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
