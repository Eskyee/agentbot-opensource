/**
 * Cost Dashboard API
 * Real data from:
 *   - Prisma: subscription plan, agent count, subscription start date
 *   - Backend proxy: model_metrics token/AI usage (if available)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys';

const PLAN_MONTHLY_COST: Record<string, number> = {
  solo: 29,
  collective: 69,
  label: 149,
  network: 499,
  underground: 29,
  starter: 29,
  pro: 69,
  scale: 149,
  enterprise: 499,
};

// Monthly token quota per plan (input + output combined)
const PLAN_TOKEN_QUOTA: Record<string, number> = {
  solo:       500_000,
  underground:500_000,
  starter:    500_000,
  collective: 2_000_000,
  pro:        2_000_000,
  label:      5_000_000,
  scale:      5_000_000,
  network:    20_000_000,
  enterprise: 20_000_000,
};

interface DailyCost {
  date: string;
  cost: number;
  tokens: number;
}

interface AgentCost {
  name: string;
  tokens: number;
  cost: number;
  calls: number;
  avgCostPerCall: number;
  model: string;
}

interface ModelBreakdown {
  model: string;
  percent: number;
  cost: number;
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get('period') || '7d';
  const days = period === '30d' ? 30 : period === 'mtd' ? new Date().getDate() : 7;

  try {
    // --- Real data from Prisma ---
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        agents: {
          select: { id: true, name: true, status: true, tier: true, createdAt: true },
        },
      },
    });

    const planKey = user?.plan || 'solo';
    const monthlyPlanCost = PLAN_MONTHLY_COST[planKey] || 0;
    const agentCount = user?.agents.length || 0;
    const activeAgents = user?.agents.filter(
      (a) => a.status === 'active' || a.status === 'running'
    ).length || 0;

    // Days in current billing period
    const startDate = user?.subscriptionStartDate || new Date();
    const daysActive = Math.max(
      1,
      Math.ceil((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    );
    const costPerDay = monthlyPlanCost / 30;

    // --- Try to get AI token usage from backend ---
    let aiTokenData: { agents: AgentCost[]; daily: DailyCost[]; modelBreakdown: ModelBreakdown[] } | null = null;
    try {
      const API_URL = getBackendApiUrl();
      const API_KEY = getInternalApiKey();
      if (API_URL && API_KEY) {
        const res = await fetch(
          `${API_URL}/api/metrics/cost?userId=${session.user.id}&days=${days}`,
          {
            headers: { Authorization: `Bearer ${API_KEY}` },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (res.ok) {
          aiTokenData = await res.json();
        }
      }
    } catch {
      // Backend not available — use plan-based data only
    }

    // --- Build daily cost from plan subscription ---
    const now = new Date();
    const daily: DailyCost[] = Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - 1 - i));
      const aiCost = aiTokenData?.daily?.[i]?.cost ?? 0;
      const tokens = aiTokenData?.daily?.[i]?.tokens ?? 0;
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost: parseFloat((costPerDay + aiCost).toFixed(2)),
        tokens,
      };
    });

    // --- Agent breakdown from Prisma ---
    const agentCostPerAgent = activeAgents > 0 ? monthlyPlanCost / activeAgents : 0;
    const agents: AgentCost[] = (user?.agents || []).map((agent) => {
      const aiAgent = aiTokenData?.agents?.find((a) => a.name === agent.name);
      return {
        name: agent.name || agent.id,
        tokens: aiAgent?.tokens ?? 0,
        cost: parseFloat(((agentCostPerAgent / 30) * days + (aiAgent?.cost ?? 0)).toFixed(2)),
        calls: aiAgent?.calls ?? 0,
        avgCostPerCall: aiAgent?.avgCostPerCall ?? 0,
        model: aiAgent?.model ?? planKey,
      };
    });

    const periodCost = parseFloat((costPerDay * days).toFixed(2));
    const totalTokens = (aiTokenData?.agents ?? []).reduce((s, a) => s + a.tokens, 0);
    const totalCalls = (aiTokenData?.agents ?? []).reduce((s, a) => s + a.calls, 0);
    const aiCostTotal = (aiTokenData?.agents ?? []).reduce((s, a) => s + a.cost, 0);
    const totalCost = parseFloat((periodCost + aiCostTotal).toFixed(2));

    const modelBreakdown: ModelBreakdown[] = aiTokenData?.modelBreakdown ?? [
      { model: planKey, percent: 100, cost: periodCost },
    ];

    // Monthly token quota and usage
    const monthlyQuota = PLAN_TOKEN_QUOTA[planKey] ?? 500_000;
    // Use MTD tokens from backend if available, else scale period tokens to month
    const mtdTokens = period === 'mtd'
      ? totalTokens
      : Math.round(totalTokens * (new Date().getDate() / days));
    const quotaPercent = monthlyQuota > 0
      ? Math.min(100, Math.round((mtdTokens / monthlyQuota) * 100))
      : 0;

    return NextResponse.json({
      period,
      summary: {
        totalCost,
        totalTokens,
        totalCalls,
        avgCostPerCall: totalCalls > 0
          ? parseFloat((aiCostTotal / totalCalls).toFixed(4))
          : 0,
      },
      quota: {
        monthlyTokens: monthlyQuota,
        usedTokens: mtdTokens,
        percent: quotaPercent,
        overageWarning: quotaPercent >= 80,
        nextPlan: planKey === 'solo' || planKey === 'underground' ? 'collective'
          : planKey === 'collective' ? 'label'
          : planKey === 'label' ? 'network'
          : null,
      },
      agents,
      daily,
      modelBreakdown,
      isMockData: false,
      plan: planKey,
      planMonthlyCost: monthlyPlanCost,
      agentCount,
      activeAgents,
    });
  } catch (error) {
    console.error('[Cost API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
