/**
 * Token Sponsorship Simulator
 * Forward mode: set liquidity tokens → calculate market cap
 * Reverse mode: set desired market cap → calculate liquidity tokens
 */
import { NextRequest, NextResponse } from 'next/server';

// GET /api/agents/simulator
export async function GET(req: NextRequest) {
  try {
    const totalSupply = parseFloat(req.nextUrl.searchParams.get('totalSupply') || '0');
    let liquidityTokens = parseFloat(req.nextUrl.searchParams.get('liquidityTokens') || '0');
    const desiredMarketCapUsd = parseFloat(req.nextUrl.searchParams.get('desiredMarketCapUsd') || '0');
    const sponsorshipAmount = parseFloat(req.nextUrl.searchParams.get('sponsorshipAmount') || '1000'); // Default SELFCLAW amount

    if (!totalSupply || totalSupply <= 0) {
      return NextResponse.json({
        error: 'totalSupply is required (positive number)',
        usage: [
          'Forward: GET /api/agents/simulator?totalSupply=1000000&liquidityTokens=100000',
          'Reverse: GET /api/agents/simulator?totalSupply=1000000&desiredMarketCapUsd=5000',
        ],
      }, { status: 400 });
    }

    let mode = 'forward';

    // Reverse mode: calculate liquidity tokens from desired market cap
    if (desiredMarketCapUsd > 0 && liquidityTokens <= 0) {
      mode = 'reverse';
      const desiredPrice = desiredMarketCapUsd / totalSupply;
      liquidityTokens = desiredPrice > 0 ? sponsorshipAmount / desiredPrice : 0;
      if (liquidityTokens > totalSupply) liquidityTokens = totalSupply;
      if (liquidityTokens < 1) liquidityTokens = 1;
    }

    if (liquidityTokens <= 0) {
      return NextResponse.json({
        error: 'Provide either liquidityTokens (forward) or desiredMarketCapUsd (reverse)',
      }, { status: 400 });
    }

    if (liquidityTokens > totalSupply) {
      return NextResponse.json({ error: 'liquidityTokens cannot exceed totalSupply' }, { status: 400 });
    }

    const liquidityPercent = (liquidityTokens / totalSupply) * 100;
    const initialPrice = sponsorshipAmount / liquidityTokens;
    const marketCap = initialPrice * totalSupply;

    // Alternative scenarios
    const scenarios = [
      { label: 'High valuation (10%)', liquidityTokens: totalSupply * 0.1 },
      { label: 'Moderate (25%)', liquidityTokens: totalSupply * 0.25 },
      { label: 'Deep liquidity (50%)', liquidityTokens: totalSupply * 0.5 },
    ].map((s) => ({
      ...s,
      initialPrice: sponsorshipAmount / s.liquidityTokens,
      marketCap: (sponsorshipAmount / s.liquidityTokens) * totalSupply,
      liquidityPercent: (s.liquidityTokens / totalSupply) * 100,
    }));

    return NextResponse.json({
      mode,
      input: {
        totalSupply,
        liquidityTokens: Math.round(liquidityTokens),
        liquidityPercent: `${liquidityPercent.toFixed(1)}%`,
        sponsorshipAmount,
        ...(mode === 'reverse' ? { desiredMarketCapUsd } : {}),
      },
      valuation: {
        initialPrice,
        marketCap,
        interpretation:
          mode === 'reverse'
            ? `To target $${desiredMarketCapUsd.toLocaleString()} market cap, provide ${Math.round(liquidityTokens).toLocaleString()} tokens (${liquidityPercent.toFixed(1)}% of supply)`
            : `By providing ${Math.round(liquidityTokens).toLocaleString()} tokens, you're valuing at $${marketCap.toLocaleString()} market cap`,
      },
      formula: {
        initialPrice: 'sponsorshipAmount / liquidityTokens',
        marketCap: 'initialPrice * totalSupply',
        reverse: 'liquidityTokens = (sponsorshipAmount * totalSupply) / desiredMarketCap',
        keyInsight: 'Fewer tokens in liquidity = higher price = higher market cap (but thinner trading)',
      },
      alternativeScenarios: scenarios,
      guidance: {
        liquidityRange: '10-40% of supply is typical',
        supplyRange: '1M-100M tokens is common',
        tradeoff: 'Higher market cap = thinner liquidity. Lower = deeper, more stable.',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
