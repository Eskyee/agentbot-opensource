/**
 * Agent Economics API
 * Revenue/cost tracking with P/L calculation and runway estimation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity/logger';

// POST /api/agents/economics/revenue — log revenue event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'revenue') {
      const { humanId, agentPublicKey, agentName, amount, token, tokenAddress, source, description, txHash, chain } = body;

      if (!humanId || !amount || !token || !source) {
        return NextResponse.json(
          { error: 'humanId, amount, token, and source are required' },
          { status: 400 }
        );
      }

      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
      }

      const event = await prisma.revenue_events.create({
        data: {
          humanId,
          agentPublicKey: agentPublicKey || null,
          agentName: agentName || null,
          amount: String(amount),
          token: String(token),
          tokenAddress: tokenAddress || null,
          source: String(source),
          description: description || null,
          txHash: txHash || null,
          chain: chain || 'base',
        },
      });

      await logActivity({
        eventType: 'revenue_logged',
        humanId,
        agentPublicKey,
        agentName,
        metadata: { amount, token, source, txHash },
      });

      return NextResponse.json({ success: true, event });
    }

    if (action === 'cost') {
      const { humanId, agentPublicKey, agentName, costType, amount, currency, description, metadata } = body;

      if (!humanId || !costType || !amount) {
        return NextResponse.json(
          { error: 'humanId, costType, and amount are required' },
          { status: 400 }
        );
      }

      const validTypes = ['infra', 'compute', 'ai_credits', 'bandwidth', 'storage', 'other'];
      if (!validTypes.includes(costType)) {
        return NextResponse.json(
          { error: `Invalid costType. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }

      const event = await prisma.cost_events.create({
        data: {
          humanId,
          agentPublicKey: agentPublicKey || null,
          agentName: agentName || null,
          costType,
          amount: String(amount),
          currency: currency || 'USD',
          description: description || null,
          metadata: metadata || undefined,
        },
      });

      await logActivity({
        eventType: 'cost_logged',
        humanId,
        agentPublicKey,
        agentName,
        metadata: { costType, amount, currency },
      });

      return NextResponse.json({ success: true, event });
    }

    return NextResponse.json({ error: 'Invalid action. Use "revenue" or "cost".' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[economics] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/agents/economics?humanId=xxx — P/L summary
export async function GET(req: NextRequest) {
  try {
    const humanId = req.nextUrl.searchParams.get('humanId');
    if (!humanId) {
      return NextResponse.json({ error: 'humanId is required' }, { status: 400 });
    }

    const [revenue, costs] = await Promise.all([
      prisma.revenue_events.findMany({
        where: { humanId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.cost_events.findMany({
        where: { humanId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Aggregate revenue by token
    const revenueTotals: Record<string, number> = {};
    for (const r of revenue) {
      revenueTotals[r.token] = (revenueTotals[r.token] || 0) + parseFloat(r.amount);
    }

    // Aggregate costs by type
    const costTotals: Record<string, number> = {};
    let totalCostUsd = 0;
    for (const c of costs) {
      costTotals[c.costType] = (costTotals[c.costType] || 0) + parseFloat(c.amount);
      if (c.currency === 'USD') totalCostUsd += parseFloat(c.amount);
    }

    // Monthly costs for runway
    const now = new Date();
    const monthlyCosts = costs.filter((c) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlySpend = monthlyCosts.reduce((sum, c) => sum + parseFloat(c.amount), 0);

    const totalRevenueUsd = revenueTotals['USDC'] || revenueTotals['USD'] || 0;
    const netUsd = totalRevenueUsd - totalCostUsd;
    const runway = monthlySpend > 0 ? Math.max(0, Math.round(netUsd / monthlySpend)) : null;

    return NextResponse.json({
      humanId,
      revenue: {
        totalEvents: revenue.length,
        totals: revenueTotals,
        recent: revenue.slice(0, 5),
      },
      costs: {
        totalEvents: costs.length,
        totalUsd: totalCostUsd,
        byType: costTotals,
        monthlySpend,
        recent: costs.slice(0, 5),
      },
      profitLoss: {
        totalRevenueUsd,
        totalCostUsd,
        netUsd,
        status: netUsd >= 0 ? 'profitable' : 'deficit',
      },
      runwayMonths: runway,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[economics] GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
