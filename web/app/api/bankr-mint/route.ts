import { NextRequest, NextResponse } from 'next/server';

/**
 * baseFM / RaveCulture - Bankr Minting API
 * @bankr/sdk removed: its transitive dep x402-fetch@^latest breaks npm install.
 * TODO: Re-enable once @bankr/sdk fixes its dependency tree.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, assetName, network = 'base' } = await req.json();

    if (!walletAddress || !assetName) {
      return NextResponse.json(
        { error: 'Missing walletAddress or assetName' },
        { status: 400 }
      );
    }

    // Bankr SDK temporarily disabled — broken dep in @bankr/sdk@0.1.0-alpha.9
    return NextResponse.json(
      { error: 'Bankr minting is temporarily unavailable.' },
      { status: 503 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
