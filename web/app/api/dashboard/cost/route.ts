/**
 * Cost Dashboard API
 * Aggregates usage data from the backend API and returns cost metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BACKEND_URL = process.env.BACKEND_API_URL || 'https://agentbot-api.onrender.com';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Model pricing (per 1M tokens) — update as needed
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-7-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku': { input: 0.80, output: 4.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'gemini-pro': { input: 0.50, output: 1.50 },
  'kimi-k2.5': { input: 0.14, output: 0.28 },
};

/**
 * GET /api/dashboard/cost?period=7d
 * Returns aggregated cost data
 */
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period') || '7d';
  const days = period === '30d' ? 30 : period === 'mtd' ? new Date().getDate() : 7;

  try {
    // Try to get real usage data from database
    const usageData = await pool.query(`
      SELECT 
        agent_id,
        model,
        DATE(created_at) as date,
        COUNT(*) as calls,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(cost_usd) as cost_usd
      FROM usage_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY agent_id, model, DATE(created_at)
      ORDER BY date DESC
    `).catch(() => ({ rows: [] }));

    // If no real data, return mock data with a flag
    if (usageData.rows.length === 0) {
      // Generate realistic mock data for the dashboard
      const now = new Date();
      const daily = Array.from({ length: days }, (_, i) => {
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

      const agents = [
        { name: 'Atlas', tokens: 2840000, cost: 8.52, calls: 1247, avgCostPerCall: 0.0068, model: 'claude-3-7-sonnet' },
        { name: 'Watchtower', tokens: 920000, cost: 2.76, calls: 412, avgCostPerCall: 0.0067, model: 'claude-3-5-haiku' },
        { name: 'DJ Bot', tokens: 480000, cost: 1.44, calls: 189, avgCostPerCall: 0.0076, model: 'gpt-4o-mini' },
        { name: 'Swarm-1', tokens: 320000, cost: 0.96, calls: 98, avgCostPerCall: 0.0098, model: 'kimi-k2.5' },
      ];

      const totalCost = agents.reduce((s, a) => s + a.cost, 0);
      const totalTokens = agents.reduce((s, a) => s + a.tokens, 0);
      const totalCalls = agents.reduce((s, a) => s + a.calls, 0);

      const modelBreakdown = [
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

    for (const row of usageData.rows) {
      // Aggregate by agent
      const agent = agentMap.get(row.agent_id) || { tokens: 0, cost: 0, calls: 0, model: row.model };
      agent.tokens += (row.input_tokens || 0) + (row.output_tokens || 0);
      agent.cost += parseFloat(row.cost_usd || 0);
      agent.calls += parseInt(row.calls || 0);
      agentMap.set(row.agent_id, agent);

      // Aggregate by day
      const day = dailyMap.get(row.date) || { cost: 0, tokens: 0 };
      day.cost += parseFloat(row.cost_usd || 0);
      day.tokens += (row.input_tokens || 0) + (row.output_tokens || 0);
      dailyMap.set(row.date, day);

      // Aggregate by model
      const model = modelMap.get(row.model) || { cost: 0, calls: 0 };
      model.cost += parseFloat(row.cost_usd || 0);
      model.calls += parseInt(row.calls || 0);
      modelMap.set(row.model, model);
    }

    const agents = Array.from(agentMap.entries()).map(([name, data]) => ({
      name,
      tokens: data.tokens,
      cost: parseFloat(data.cost.toFixed(2)),
      calls: data.calls,
      avgCostPerCall: parseFloat((data.cost / Math.max(data.calls, 1)).toFixed(4)),
      model: data.model,
    }));

    const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: parseFloat(data.cost.toFixed(2)),
      tokens: data.tokens,
    })).sort((a, b) => a.date.localeCompare(b.date));

    const totalCost = agents.reduce((s, a) => s + a.cost, 0);
    const totalTokens = agents.reduce((s, a) => s + a.tokens, 0);
    const totalCalls = agents.reduce((s, a) => s + a.calls, 0);

    const modelBreakdown = Array.from(modelMap.entries()).map(([model, data]) => ({
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
