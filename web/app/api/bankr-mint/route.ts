import { NextRequest, NextResponse } from 'next/server';
import { BankrClient } from '@bankr/sdk';

/**
 * baseFM / RaveCulture - Bankr Minting API
 * Server-side route to securely execute onchain actions via Bankr.
 */
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, assetName, network = 'base' } = await req.json();

    // 1. Validation
    if (!walletAddress || !assetName) {
      return NextResponse.json(
        { error: 'Missing walletAddress or assetName' },
        { status: 400 }
      );
    }

    // 2. Initialize Bankr Client (Server-only)
    const bankr = new BankrClient({
      apiKey: process.env.NEXT_PUBLIC_BANKR_API_KEY!,
      privateKey: process.env.BANKR_PRIVATE_KEY!, // Protected secret
      network: network,
    });

    // 3. Execute Mint Prompt
    // Note: We use natural language to leverage the Bankr LLM gateway for onchain intent.
    const response = await bankr.promptAndWait({
      prompt: `mint an NFT called ${assetName} for ${walletAddress} on ${network}`,
    });

    // 4. Log and Return
    console.log(`[Bankr] Minted ${assetName} for ${walletAddress} on ${network}`);
    
    return NextResponse.json({
      success: true,
      message: 'Minting process completed successfully',
      data: response,
    });

  } catch (err: any) {
    console.error('[Bankr Error]', err.message);
    return NextResponse.json(
      { error: err.message || 'The Bankr minting operation failed.' },
      { status: 500 }
    );
  }
}
