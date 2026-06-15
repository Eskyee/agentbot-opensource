import { NextRequest, NextResponse } from 'next/server';
import { searchGuideIndex } from '@/app/lib/guideSearch'

const MCP_SERVER_URL = 'https://raveculture.mintlify.app/mcp';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || ''
  const limit = Number.parseInt(req.nextUrl.searchParams.get('limit') || '12', 10)

  if (!query.trim()) {
    return NextResponse.json({ query, count: 0, results: [] })
  }

  const results = searchGuideIndex(query, Number.isFinite(limit) ? limit : 12)
  return NextResponse.json({
    query,
    count: results.length,
    results,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const localResults = searchGuideIndex(query, 12)
    if (localResults.length > 0) {
      return NextResponse.json({
        query,
        count: localResults.length,
        results: localResults,
        source: 'agentbot-local-guides',
      });
    }

    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'search_mint_starter_kit',
          arguments: { query }
        }
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Docs search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
