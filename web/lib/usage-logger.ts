/**
 * Usage Logger — records token usage for cost tracking
 * 
 * Call this after any AI API call to track costs.
 * Uses Prisma for database writes.
 */

import { prisma } from '@/app/lib/prisma';

// Model pricing per 1M tokens (input, output) in USD
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
  'deepseek-v3': { input: 0.27, output: 1.10 },
  'deepseek-r1': { input: 0.55, output: 2.19 },
  'qwen-2.5-72b': { input: 0.40, output: 1.20 },
  'mistral-large': { input: 2.0, output: 6.0 },
};

interface UsageData {
  userId: string;
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  endpoint?: string;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 1.0, output: 3.0 }; // default pricing
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Log usage to database
 * Fire-and-forget — don't block the response
 */
export function logUsage(data: UsageData): void {
  const costUsd = calculateCost(data.model, data.inputTokens, data.outputTokens);

  // Fire and forget — don't await
  prisma.usageLog.create({
    data: {
      userId: data.userId,
      agentId: data.agentId,
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      costUsd,
      endpoint: data.endpoint,
      latencyMs: data.latencyMs,
      success: data.success ?? true,
      errorMessage: data.errorMessage,
    },
  }).catch((err: Error) => {
    console.error('[UsageLogger] Failed to log usage:', err.message);
  });
}

/**
 * Get usage summary for a user
 */
export async function getUserUsage(userId: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.usageLog.findMany({
    where: {
      userId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });

  return logs;
}

/**
 * Get aggregated usage for dashboard
 */
export async function getUsageDashboard(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [agentStats, dailyStats, modelStats] = await Promise.all([
    // By agent
    prisma.$queryRaw`
      SELECT 
        agent_id as "agentId",
        model,
        COUNT(*) as calls,
        SUM(input_tokens + output_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM usage_logs
      WHERE created_at >= ${since}
      GROUP BY agent_id, model
      ORDER BY cost DESC
    `,

    // By day
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as calls,
        SUM(input_tokens + output_tokens) as tokens,
        SUM(cost_usd) as cost
      FROM usage_logs
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,

    // By model
    prisma.$queryRaw`
      SELECT 
        model,
        COUNT(*) as calls,
        SUM(cost_usd) as cost
      FROM usage_logs
      WHERE created_at >= ${since}
      GROUP BY model
      ORDER BY cost DESC
    `,
  ]);

  return { agentStats, dailyStats, modelStats };
}
