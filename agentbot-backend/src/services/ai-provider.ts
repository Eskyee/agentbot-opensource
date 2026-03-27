/**
 * AI Provider Service
 *
 * LOW-03 FIX: Added per-user token quota tracking.
 *  - chat() now accepts an optional context { userId, agentId, plan } parameter.
 *  - After each successful completion, usage is logged to model_metrics (fire-and-forget).
 *  - Before calling the API, monthly token consumption is checked against per-plan
 *    limits. Requests that would exceed the quota are rejected with HTTP 429.
 *  - Plan limits are conservative defaults; adjust PLAN_MONTHLY_TOKEN_LIMITS to match
 *    your pricing commitments.
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Per-plan monthly input+output token budgets.
// Set to Infinity to disable enforcement for a plan tier.
const PLAN_MONTHLY_TOKEN_LIMITS: Record<string, number> = {
  free: 0,          // no free tier
  solo: 2_000_000,  // ~2M tokens/month
  collective: 6_000_000,
  label: 20_000_000,
  network: Infinity, // unlimited
};

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  id: string;
  model: string;
  provider: 'openrouter' | 'anthropic' | 'openai' | 'groq';
  message: {
    role: 'assistant';
    content: string;
  };
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tags: string[];
  inputCost?: number; // per 1M tokens
  outputCost?: number; // per 1M tokens
  contextWindow?: number;
  available: boolean;
}

/** Optional caller context used for quota enforcement and usage logging. */
export interface UsageContext {
  userId?: string;
  agentId?: string;
  plan?: string;
}

export class AIProviderService {
  private static OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  private static OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

  /**
   * Check which providers are available
   */
  static async checkProviders(): Promise<{ openrouter: boolean }> {
    return { openrouter: !!this.OPENROUTER_API_KEY };
  }

  /**
   * Get all available models from OpenRouter
   */
  static async getAllModels(): Promise<AvailableModel[]> {
    return this.getOpenRouterModels();
  }

  /**
   * Get models from OpenRouter
   */
  private static async getOpenRouterModels(): Promise<AvailableModel[]> {
    if (!this.OPENROUTER_API_KEY) return [];

    try {
      const response = await fetch(`${this.OPENROUTER_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${this.OPENROUTER_API_KEY}` },
      });

      if (!response.ok) return [];

      const data = await response.json() as {
        data?: Array<{
          id: string;
          name?: string;
          description?: string;
          pricing?: { prompt?: string; completion?: string };
          context_length?: number;
        }>;
      };

      return (data.data || []).map((m) => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'openrouter',
        description: m.description || `OpenRouter Model: ${m.id}`,
        tags: ['cloud', 'commercial', 'diverse-models'],
        inputCost: m.pricing ? parseFloat(m.pricing.prompt || '0') : undefined,
        outputCost: m.pricing ? parseFloat(m.pricing.completion || '0') : undefined,
        contextWindow: m.context_length,
        available: true,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Smart model selection based on task type
   */
  static async selectBestModel(taskType: string = 'general'): Promise<AvailableModel | null> {
    const allModels = await this.getAllModels();

    const taskMap: Record<string, string[]> = {
      coding: ['coding', 'logic'],
      analysis: ['analysis'],
      creative: ['creative'],
      long: ['long-context'],
      general: ['general', 'balanced'],
    };

    const tags = taskMap[taskType] || taskMap.general;
    const match = allModels.find((m) => m.tags.some((tag) => tags.includes(tag)));
    return match || allModels[0] || null;
  }

  /**
   * Returns the number of tokens consumed by userId this calendar month.
   * Returns 0 if the DB is unreachable (fail open — log a warning).
   */
  private static async getMonthlyTokenUsage(userId: string): Promise<number> {
    try {
      const result = await pool.query<{ total: string }>(
        `SELECT COALESCE(SUM(input_tokens + output_tokens), 0)::text AS total
         FROM model_metrics
         WHERE user_id = $1
           AND created_at >= date_trunc('month', NOW())`,
        [userId]
      );
      return parseInt(result.rows[0]?.total ?? '0', 10);
    } catch (err: any) {
      console.warn('[AI] Monthly token usage query failed:', err.message);
      return 0; // fail open
    }
  }

  /**
   * Log token usage to model_metrics (fire-and-forget).
   * Never throws — quota enforcement happens before the API call.
   */
  private static logUsage(
    context: UsageContext,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    success: boolean
  ): void {
    if (!process.env.DATABASE_URL) return;

    pool.query(
      `INSERT INTO model_metrics
         (model, user_id, agent_id, input_tokens, output_tokens, latency_ms, success, source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'openrouter', NOW())`,
      [
        modelId,
        context.userId ?? null,
        context.agentId ?? null,
        inputTokens,
        outputTokens,
        latencyMs,
        success,
      ]
    ).catch((err: Error) => console.error('[AI] Usage logging failed:', err.message));
  }

  /**
   * Send message to AI provider.
   *
   * @param context  Optional caller context for quota enforcement and usage logging.
   *                 If context.userId is provided, monthly token usage is checked
   *                 against the plan limit before the API call is made.
   */
  static async chat(
    messages: AIMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      top_p?: number;
      max_tokens?: number;
    },
    context: UsageContext = {}
  ): Promise<AIResponse> {
    // Quota enforcement (only if we have a userId and DB)
    if (context.userId && process.env.DATABASE_URL) {
      const plan = context.plan ?? 'solo';
      const limit = PLAN_MONTHLY_TOKEN_LIMITS[plan] ?? PLAN_MONTHLY_TOKEN_LIMITS.solo;

      if (isFinite(limit)) {
        const used = await this.getMonthlyTokenUsage(context.userId);
        if (used >= limit) {
          throw Object.assign(
            new Error(
              `Monthly token quota exceeded for plan "${plan}". ` +
              `Used ${used.toLocaleString()} of ${limit.toLocaleString()} tokens. ` +
              `Quota resets at the start of next month.`
            ),
            { code: 'QUOTA_EXCEEDED', statusCode: 429 }
          );
        }
      }
    }

    return this.chatOpenRouter(messages, modelId, options, context);
  }

  /**
   * Chat with OpenRouter
   */
  private static async chatOpenRouter(
    messages: AIMessage[],
    modelId: string,
    options?: { temperature?: number; top_p?: number; max_tokens?: number },
    context: UsageContext = {}
  ): Promise<AIResponse> {
    if (!this.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const startMs = Date.now();
    let success = false;

    try {
      const response = await fetch(`${this.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.top_p ?? 0.9,
          max_tokens: options?.max_tokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter chat failed: ${response.status}`);
      }

      const data = await response.json() as {
        id?: string;
        choices?: Array<{ message?: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      success = true;
      const latencyMs = Date.now() - startMs;

      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;

      // Log usage asynchronously — never block the response
      this.logUsage(context, modelId, inputTokens, outputTokens, latencyMs, true);

      return {
        id: data.id || `openrouter-${Date.now()}`,
        model: modelId,
        provider: 'openrouter',
        message: {
          role: 'assistant',
          content: data.choices?.[0]?.message?.content || '',
        },
        usage: data.usage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      if (!success) {
        // Log failed attempts too (latency without token counts)
        this.logUsage(context, modelId, 0, 0, Date.now() - startMs, false);
      }
    }
  }

  /**
   * Get cost estimate for a message
   */
  static async estimateCost(modelId: string, inputTokens: number, outputTokens: number): Promise<number> {
    const models = await this.getAllModels();
    const model = models.find((m) => m.id === modelId);

    if (!model || !model.inputCost || !model.outputCost) return 0;

    return (inputTokens / 1_000_000) * model.inputCost +
           (outputTokens / 1_000_000) * model.outputCost;
  }
}

export default AIProviderService;
