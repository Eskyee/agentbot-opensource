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

  // Vercel AI Gateway setup for mimo-v2-pro
  // Fail-closed: never fall back to a hardcoded literal. The previous default
  // committed an active credential to git history; the caller must set
  // VERCEL_AI_GATEWAY_KEY in env or this provider will reject every request.
  // (The leaked literal must be rotated in the Vercel dashboard separately —
  // removing the fallback here only stops new deploys from reusing it.)
  private static VERCEL_AI_GATEWAY_KEY = process.env.VERCEL_AI_GATEWAY_KEY || '';
  private static VERCEL_AI_GATEWAY_URL = 'https://gateway.ai.vercel.com/v1';

  /**
   * Check which providers are available
   */
  static async checkProviders(): Promise<{ openrouter: boolean; vercel: boolean }> {
    return { 
      openrouter: !!this.OPENROUTER_API_KEY,
      vercel: !!this.VERCEL_AI_GATEWAY_KEY 
    };
  }

  /**
   * Get all available models
   */
  static async getAllModels(): Promise<AvailableModel[]> {
    const openrouterModels = await this.getOpenRouterModels();
    
    // Inject the Factory AI Master Model: mimo-v2-pro
    const masterModel: AvailableModel = {
      id: 'xiaomi/mimo-v2-pro',
      name: 'MiMo V2 Pro (Factory Master)',
      provider: 'vercel-gateway',
      description: 'Ultra high-performance factory-grade model optimized for autonomous agent operations.',
      tags: ['factory', 'master', 'autonomous', 'logic'],
      inputCost: 0.01,
      outputCost: 0.03,
      contextWindow: 128000,
      available: !!this.VERCEL_AI_GATEWAY_KEY,
    };

    return [masterModel, ...openrouterModels];
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[AI] Monthly token usage query failed:', message);
      return 0; // fail open
    }
  }

  /**
   * Atomically reserves up to `estimatedTokens` of monthly quota for the user.
   *
   * Replaces the previous SELECT-then-decide pattern, which let concurrent
   * requests sail past the plan cap because two callers could both observe
   * `used = 1.99M` and both decide they're under the 2M limit.
   *
   * Implementation:
   *   1. Compute prior real usage from model_metrics (the source of truth).
   *   2. UPSERT the monthly reservation row with a WHERE clause that only
   *      commits if `prior_usage + reserved + estimate <= limit`.
   *   3. If the WHERE fails, the upsert affects 0 rows and we reject.
   *
   * Estimates are coarse — we settle the actual count in `logUsage` after the
   * API call. Over-reservation is corrected by subtracting the difference;
   * under-reservation is accepted (the metric write is the truth).
   *
   * Returns true if the reservation was granted, false if it would exceed
   * the cap.
   */
  private static async reserveQuota(
    userId: string,
    estimatedTokens: number,
    limit: number
  ): Promise<{ ok: boolean; used: number }> {
    const used = await this.getMonthlyTokenUsage(userId);
    try {
      // The WHERE clause must gate BOTH the INSERT and the UPDATE branches.
      // Without the guarded INSERT (`SELECT ... FROM gate`), a fresh
      // user/month with `used` already over the limit would still slip
      // through on the very first request because ON CONFLICT WHERE only
      // applies to the UPDATE branch.
      const result = await pool.query<{ reserved: string }>(
        `WITH gate AS (
           SELECT 1 AS ok
           WHERE $3::bigint + $2::bigint <= $4::bigint
         )
         INSERT INTO ai_token_reservations (user_id, period_start, reserved, updated_at)
         SELECT $1, date_trunc('month', NOW()), $2, NOW() FROM gate
         ON CONFLICT (user_id, period_start) DO UPDATE
           SET reserved = ai_token_reservations.reserved + EXCLUDED.reserved,
               updated_at = NOW()
           WHERE ai_token_reservations.reserved + $3 + $2 <= $4
         RETURNING reserved::text`,
        [userId, estimatedTokens, used, limit]
      );
      if (result.rowCount === 0) {
        return { ok: false, used };
      }
      return { ok: true, used };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[AI] Quota reservation failed (failing open):', message);
      // Fail open on DB outage — usage is still bounded by the underlying
      // model_metrics check on subsequent calls.
      return { ok: true, used };
    }
  }

  /**
   * Settle a reservation against actual usage by fully releasing the
   * estimate.
   *
   * Why we release the FULL estimate rather than `actual - estimated`:
   *
   *   - `reserveQuota`'s gating check is `existing_reserved + used + new
   *     <= limit`, where `used` comes from `getMonthlyTokenUsage` (i.e.
   *     `model_metrics`).
   *   - `logUsage` writes `actual` into `model_metrics`, so the moment
   *     that row lands, `used` already counts the actual tokens.
   *   - If we left `actual` in `reserved` (delta = actual - estimated)
   *     we would count those tokens TWICE on the next reservation —
   *     once via `reserved`, once via `used`. The user's effective
   *     quota would be roughly halved over time.
   *
   * The `actual` value is therefore unused here; it remains in the
   * signature so callers don't have to special-case the failure path
   * (where they pass `actual = 0` explicitly).
   */
  private static async settleQuota(
    userId: string,
    estimated: number,
    _actual: number
  ): Promise<void> {
    if (estimated <= 0) return;
    try {
      await pool.query(
        `UPDATE ai_token_reservations
            SET reserved = GREATEST(0, reserved - $1),
                updated_at = NOW()
          WHERE user_id = $2
            AND period_start = date_trunc('month', NOW())`,
        [estimated, userId]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[AI] Quota settlement failed:', message);
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
    // Atomic quota enforcement (only if we have a userId and DB).
    //
    // We reserve an upper-bound estimate before the API call and settle the
    // delta against actual usage afterwards. The reservation row UPSERTs
    // with a WHERE clause that only succeeds if the new total stays under
    // the plan cap, so concurrent requests can't all observe "1.99M used"
    // and each green-light themselves.
    let reservedEstimate = 0;
    if (context.userId && process.env.DATABASE_URL) {
      const plan = context.plan ?? 'solo';
      const limit = PLAN_MONTHLY_TOKEN_LIMITS[plan] ?? PLAN_MONTHLY_TOKEN_LIMITS.solo;

      // L-5: PLAN_MONTHLY_TOKEN_LIMITS uses Infinity for the 'network' plan
      // (unlimited). isFinite(Infinity) === false, so the quota check is
      // intentionally skipped for unlimited plans. Don't change this without
      // also changing how PLAN_MONTHLY_TOKEN_LIMITS encodes "no cap".
      if (isFinite(limit)) {
        // Estimate: prompt characters /4 (rough chars-per-token) + max_tokens
        // ceiling. Caller-supplied max_tokens dominates for chat completions.
        const promptChars = messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0);
        reservedEstimate = Math.ceil(promptChars / 4) + (options?.max_tokens ?? 1024);

        const reservation = await this.reserveQuota(context.userId, reservedEstimate, limit);
        if (!reservation.ok) {
          throw Object.assign(
            new Error(
              `Monthly token quota exceeded for plan "${plan}". ` +
              `Used ${reservation.used.toLocaleString()} of ${limit.toLocaleString()} tokens. ` +
              `Quota resets at the start of next month.`
            ),
            { code: 'QUOTA_EXCEEDED', statusCode: 429 }
          );
        }
      }
    }

    try {
      const response = modelId === 'xiaomi/mimo-v2-pro'
        ? await this.chatVercelGateway(messages, modelId, options, context)
        : await this.chatOpenRouter(messages, modelId, options, context);

      // Settle reservation. settleQuota releases the full reservedEstimate
      // regardless of actualTokens (model_metrics is the source of truth for
      // `used`); the `_actual` parameter exists only for logging. We MUST
      // call it on every successful chat — even when the provider doesn't
      // report usage — otherwise the reservation leaks into
      // ai_token_reservations.reserved for the rest of the month and
      // permanently shrinks the user's effective monthly quota (each new
      // call is gated on `existing_reserved + used + new_estimate <= limit`).
      if (context.userId && reservedEstimate > 0) {
        const actualTokens = response.usage?.total_tokens
          ?? ((response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0));
        await this.settleQuota(context.userId, reservedEstimate, actualTokens);
      }

      return response;
    } catch (err) {
      // On API failure release the entire reservation so the user isn't
      // billed against quota for a request that never produced tokens.
      if (context.userId && reservedEstimate > 0) {
        await this.settleQuota(context.userId, reservedEstimate, 0);
      }
      throw err;
    }
  }

  /**
   * Chat with Vercel AI Gateway (mimo-v2-pro)
   */
  private static async chatVercelGateway(
    messages: AIMessage[],
    modelId: string,
    options?: { temperature?: number; top_p?: number; max_tokens?: number },
    context: UsageContext = {}
  ): Promise<AIResponse> {
    if (!this.VERCEL_AI_GATEWAY_KEY) {
      throw new Error('Vercel AI Gateway key not configured');
    }

    const startMs = Date.now();
    let success = false;

    try {
      const response = await fetch(`${this.VERCEL_AI_GATEWAY_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.VERCEL_AI_GATEWAY_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        throw new Error(`Vercel AI Gateway chat failed: ${response.status}`);
      }

      const data = await response.json() as any;
      success = true;
      const latencyMs = Date.now() - startMs;

      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;

      this.logUsage(context, modelId, inputTokens, outputTokens, latencyMs, true);

      return {
        id: data.id || `vercel-${Date.now()}`,
        model: modelId,
        provider: 'groq', // mimicking groq-like response speed through gateway
        message: {
          role: 'assistant',
          content: data.choices?.[0]?.message?.content || '',
        },
        usage: data.usage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      if (!success) {
        this.logUsage(context, modelId, 0, 0, Date.now() - startMs, false);
      }
    }
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
        signal: AbortSignal.timeout(60_000),
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
