import { NextRequest, NextResponse } from 'next/server';

const CLAWMERCHANTS_BASE = 'https://clawmerchants.com';

// ClawMerchants data feeds available for integration
const FEEDS = {
  'defi-yields': '/v1/data/defi-yields-live',
  'token-anomalies': '/v1/data/token-anomalies-live',
  'security-intel': '/v1/data/security-intel-live',
  'market-data': '/v1/data/market-data-live',
  'whale-alert': '/v1/data/whale-alert-live',
  'gas-prices': '/v1/data/gas-prices-live',
  'defi-tvl': '/v1/data/defi-protocol-tvl-live',
  'stablecoin-flows': '/v1/data/stablecoin-flows-live',
  'dex-volume': '/v1/data/dex-volume-live',
  'liquidations': '/v1/data/liquidations-live',
  'ai-ecosystem': '/v1/data/ai-ecosystem-intel-live',
  'crypto-sentiment': '/v1/data/crypto-sentiment-live',
  'hn-trending': '/v1/data/hn-top-stories-live',
  'github-trending': '/v1/data/github-trending-live',
  'hf-papers': '/v1/data/hf-papers-live',
};

export async function GET(req: NextRequest) {
  const feed = req.nextUrl.searchParams.get('feed');
  const preview = req.nextUrl.searchParams.get('preview') === 'true';
  
  // List available feeds
  if (!feed) {
    return NextResponse.json({
      feeds: Object.keys(FEEDS).map(id => ({
        id,
        endpoint: `${CLAWMERCHANTS_BASE}${FEEDS[id as keyof typeof FEEDS]}`,
        preview: `${CLAWMERCHANTS_BASE}/v1/preview/${id}`,
      })),
      total: Object.keys(FEEDS).length,
      docs: 'https://clawmerchants.com/openapi.json',
    });
  }
  
  // Validate feed
  if (!FEEDS[feed as keyof typeof FEEDS]) {
    return NextResponse.json({
      error: 'Unknown feed',
      available: Object.keys(FEEDS),
    }, { status: 400 });
  }
  
  try {
    const endpoint = FEEDS[feed as keyof typeof FEEDS];
    const url = preview 
      ? `${CLAWMERCHANTS_BASE}/v1/preview/${feed}`
      : `${CLAWMERCHANTS_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.status === 402) {
      // Payment required - return the 402 challenge
      const challenge = await response.json();
      return NextResponse.json({
        status: 'payment_required',
        feed,
        challenge,
        hint: 'Use x402 or MPP to pay for this data feed',
      }, { status: 402 });
    }
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'Feed unavailable',
        status: response.status,
      }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json({
      feed,
      source: 'clawmerchants',
      data,
    });
  } catch (error) {
    console.error('[ClawMerchants] Feed error:', error);
    return NextResponse.json({
      error: 'Feed fetch failed',
      message: (error as Error).message,
    }, { status: 500 });
  }
}
