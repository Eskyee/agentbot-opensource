/**
 * Cost Dashboard API
 * Aggregates usage data from usage_logs table via Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';

interface AgentCost {
  name: string;
  tokens: number;
  cost: number;
  calls: number;
  avgCostPerCall: number;
  model: string;
}

interface DailyCost {
  date: string;
  cost: number;
  tokens: number;
}

interface ModelBreakdown {
  model: string;
  percent: number;
  cost: number;
}

/**
 * GET /api/dashboard/cost?period=7d
 * Returns aggregated cost data
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get('period') || '7d';
  const days = period === '30d' ? 30 : period === 'mtd' ? new Date().getDate() : 7;

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Always return mock data — UsageLog model not yet in schema
    // TODO: Add UsageLog model to Prisma schema and enable real queries
    const logs: any[] = [];

    console.log(`[Cost API] Found ${logs.length} usage logs`);

    // If no real data, return mock data with a flag
    if (logs.length === 0) {
      const now = new Date();
      const daily: DailyCost[] = Array.from({ length: days }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (days - 1 - i));
        const cost = 0.8 + Math.random() * 1.2;
        const tokens = Math.floor(250000 + Math.random() * 400000);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          cost: parseFloat(cost.toFixed(2)),
          tokens,
        };
      });

      const agents: AgentCost[] = [
        { name: 'Atlas', tokens: 2840000, cost: 8.52, calls: 1247, avgCostPerCall: 0.0068, model: 'claude-3-7-sonnet' },
        { name: 'Watchtower', tokens: 920000, cost: 2.76, calls: 412, avgCostPerCall: 0.0067, model: 'claude-3-5-haiku' },
        { name: 'DJ Bot', tokens: 480000, cost: 1.44, calls: 189, avgCostPerCall: 0.0076, model: 'gpt-4o-mini' },
        { name: 'Swarm-1', tokens: 320000, cost: 0.96, calls: 98, avgCostPerCall: 0.0098, model: 'kimi-k2.5' },
      ];

      const totalCost = agents.reduce((s, a) => s + a.cost, 0);
      const totalTokens = agents.reduce((s, a) => s + a.tokens, 0);
      const totalCalls = agents.reduce((s, a) => s + a.calls, 0);

      const modelBreakdown: ModelBreakdown[] = [
        { model: 'claude-3-7-sonnet', percent: 68, cost: parseFloat((totalCost * 0.68).toFixed(2)) },
        { model: 'claude-3-5-haiku', percent: 24, cost: parseFloat((totalCost * 0.24).toFixed(2)) },
        { model: 'gpt-4o-mini', percent: 8, cost: parseFloat((totalCost * 0.08).toFixed(2)) },
      ];

      return NextResponse.json({
        period,
        summary: {
          totalCost: parseFloat(totalCost.toFixed(2)),
          totalTokens,
          totalCalls,
          avgCostPerCall: parseFloat((totalCost / totalCalls).toFixed(4)),
        },
        agents,
        daily,
        modelBreakdown,
        isMockData: true,
        message: 'Usage tracking not yet configured — showing sample data',
      });
    }

    // Process real data
    const agentMap = new Map<string, { tokens: number; cost: number; calls: number; model: string }>();
    const dailyMap = new Map<string, { cost: number; tokens: number }>();
    const modelMap = new Map<string, { cost: number; calls: number }>();

    for (const row of logs) {
      const tokens = (row.inputTokens || 0) + (row.outputTokens || 0);
      const cost = parseFloat(String(row.costUsd || 0));

      // Aggregate by agent
      const agent = agentMap.get(row.agentId) || { tokens: 0, cost: 0, calls: 0, model: row.model };
      agent.tokens += tokens;
      agent.cost += cost;
      agent.calls += 1;
      agentMap.set(row.agentId, agent);

      // Aggregate by day
      const dateKey = row.createdAt.toISOString().split('T')[0];
      const day = dailyMap.get(dateKey) || { cost: 0, tokens: 0 };
      day.cost += cost;
      day.tokens += tokens;
      dailyMap.set(dateKey, day);

      // Aggregate by model
      const model = modelMap.get(row.model) || { cost: 0, calls: 0 };
      model.cost += cost;
      model.calls += 1;
      modelMap.set(row.model, model);
    }

    const agents: AgentCost[] = Array.from(agentMap.entries()).map(([name, data]) => ({
      name,
      tokens: data.tokens,
      cost: parseFloat(data.cost.toFixed(2)),
      calls: data.calls,
      avgCostPerCall: parseFloat((data.cost / Math.max(data.calls, 1)).toFixed(4)),
      model: data.model,
    }));

    const daily: DailyCost[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: parseFloat(data.cost.toFixed(2)),
      tokens: data.tokens,
    })).sort((a, b) => a.date.localeCompare(b.date));

    const totalCost = agents.reduce((s, a) => s + a.cost, 0);
    const totalTokens = agents.reduce((s, a) => s + a.tokens, 0);
    const totalCalls = agents.reduce((s, a) => s + a.calls, 0);

    const modelBreakdown: ModelBreakdown[] = Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      percent: totalCost > 0 ? parseFloat(((data.cost / totalCost) * 100).toFixed(0)) : 0,
      cost: parseFloat(data.cost.toFixed(2)),
    })).sort((a, b) => b.cost - a.cost);

    return NextResponse.json({
      period,
      summary: {
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalTokens,
        totalCalls,
        avgCostPerCall: parseFloat((totalCost / Math.max(totalCalls, 1)).toFixed(4)),
      },
      agents: agents.sort((a, b) => b.cost - a.cost),
      daily,
      modelBreakdown,
      isMockData: false,
    });

  } catch (error) {
    console.error('[Cost API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost data' },
      { status: 500 }
    );
  }
}
