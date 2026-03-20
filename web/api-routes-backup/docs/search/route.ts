export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = 'https://raveculture.mintlify.app/mcp';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
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
