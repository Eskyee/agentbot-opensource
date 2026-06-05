import { NextRequest, NextResponse } from 'next/server';

const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME;
const CDP_API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY;

// Base token addresses
const TOKENS = {
  ETH: '0x0000000000000000000000000000000000000000',
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
  DEGEN: '0x4ed4E862860beD51a9570b96d89aF5E1a0EfE8ee',
  AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
} as const;

// Known token metadata for display
const TOKEN_META: Record<string, { symbol: string; decimals: number; name: string }> = {
  [TOKENS.ETH]: { symbol: 'ETH', decimals: 18, name: 'Ethereum' },
  [TOKENS.WETH]: { symbol: 'WETH', decimals: 18, name: 'Wrapped Ether' },
  [TOKENS.USDC]: { symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  [TOKENS.USDbC]: { symbol: 'USDbC', decimals: 6, name: 'USD Coin (Bridged)' },
  [TOKENS.DEGEN]: { symbol: 'DEGEN', decimals: 18, name: 'Degen' },
  [TOKENS.AERO]: { symbol: 'AERO', decimals: 18, name: 'Aerodrome' },
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'tokens') {
    return NextResponse.json({
      tokens: Object.entries(TOKEN_META).map(([address, meta]) => ({
        address,
        ...meta,
      })),
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { action, fromToken, toToken, fromAmount, walletAddress, slippageBps } = await req.json();

  if (!CDP_API_KEY_NAME || !CDP_API_KEY_PRIVATE_KEY) {
    return NextResponse.json({ error: 'CDP not configured' }, { status: 500 });
  }

  try {
    // Dynamically import CDP SDK to avoid SSR issues
    const { CdpClient } = await import('@coinbase/cdp-sdk');
    const cdp = new CdpClient();

    if (action === 'quote') {
      // Get swap price estimate
      const fromMeta = TOKEN_META[fromToken];
      const toMeta = TOKEN_META[toToken];

      if (!fromMeta || !toMeta) {
        return NextResponse.json({ error: 'Unknown token' }, { status: 400 });
      }

      // Convert human amount to raw amount
      const rawAmount = BigInt(Math.floor(parseFloat(fromAmount) * Math.pow(10, fromMeta.decimals)));

      const swapPrice = await cdp.evm.getSwapPrice({
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: rawAmount,
        network: 'base',
        taker: walletAddress,
      }) as any;

      return NextResponse.json({
        success: true,
        from: { ...fromMeta, address: fromToken, amount: fromAmount },
        to: { ...toMeta, address: toToken, amount: swapPrice.toAmount ? String(Number(swapPrice.toAmount) / Math.pow(10, toMeta.decimals)) : null },
        minToAmount: swapPrice.minToAmount ? String(Number(swapPrice.minToAmount) / Math.pow(10, toMeta.decimals)) : null,
        liquidityAvailable: swapPrice.liquidityAvailable,
        priceImpact: swapPrice.priceImpact,
        gas: swapPrice.gas,
      });
    }

    if (action === 'swap') {
      // Execute swap via CDP account
      const account = await cdp.evm.getOrCreateAccount({ name: 'AgentbotSwap' });

      const fromMeta = TOKEN_META[fromToken];
      const rawAmount = BigInt(Math.floor(parseFloat(fromAmount) * Math.pow(10, fromMeta.decimals)));

      const swapQuote = await account.quoteSwap({
        network: 'base',
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: rawAmount,
        slippageBps: slippageBps || 100, // 1% default
      });

      if (!swapQuote.liquidityAvailable) {
        return NextResponse.json({ error: 'Insufficient liquidity' }, { status: 400 });
      }

      const result = await swapQuote.execute() as any;

      return NextResponse.json({
        success: true,
        transactionHash: result.transactionHash,
        toAmount: result.toAmount,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Swap error:', error);
    return NextResponse.json({ error: error.message || 'Swap failed' }, { status: 500 });
  }
}
