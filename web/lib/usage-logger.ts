/**
 * Usage Logger — records token usage for cost tracking
 * 
 * Console-only for now. TODO: persist to DB when usageLog model
 * is added to Prisma schema.
 */

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
  const pricing = MODEL_PRICING[model] || { input: 1.0, output: 3.0 };
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Log usage — console only (DB persistence pending)
 */
export function logUsage(data: UsageData): void {
  const costUsd = calculateCost(data.model, data.inputTokens, data.outputTokens);
  console.log(`[UsageLogger] ${data.agentId} | ${data.model} | ${data.inputTokens}+${data.outputTokens} tokens | $${costUsd.toFixed(6)}`);
}
