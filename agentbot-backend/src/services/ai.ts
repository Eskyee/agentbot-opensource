import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type ModelTier = 'reasoning' | 'coding' | 'fast' | 'creative';

export interface AIResponse {
  model: string;
  response: string;
  latency: number;
  source: 'cloud';
}

/** Per-model request timeout in milliseconds */
const MODEL_TIMEOUT_MS = Number(process.env.AI_MODEL_TIMEOUT_MS ?? 30_000);

export class AIService {
  private static OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

  private static TIER_CONFIG: Record<ModelTier, { primary: string; fallbacks: string[] }> = {
    reasoning: {
      primary: 'deepseek/deepseek-r1',
      fallbacks: ['meta-llama/llama-3.3-70b-instruct', 'moonshotai/kimi-k2.5'],
    },
    coding: {
      primary: 'qwen/qwen-2.5-coder-32b-instruct',
      fallbacks: ['deepseek/deepseek-r1', 'google/gemini-2.0-flash-001'],
    },
    fast: {
      primary: 'meta-llama/llama-3.3-70b-instruct',
      fallbacks: ['mistralai/mistral-7b-instruct', 'google/gemini-2.0-flash-001'],
    },
    creative: {
      primary: 'moonshotai/kimi-k2.5',
      fallbacks: ['deepseek/deepseek-r1', 'meta-llama/llama-3.3-70b-instruct'],
    },
  };

  /**
   * Executes a prompt using the tiered fallback system via OpenRouter.
   * Each model attempt is bounded by MODEL_TIMEOUT_MS to prevent hangs.
   */
  static async prompt(
    tier: ModelTier,
    prompt: string,
    systemPrompt?: string
  ): Promise<AIResponse> {
    const config = this.TIER_CONFIG[tier];
    const models = [config.primary, ...config.fallbacks];
    const startTime = Date.now();

    for (const model of models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

      try {
        const response = await fetch(this.OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://agentbot.raveculture.xyz',
            'X-Title': 'Agentbot',
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt },
            ],
            temperature: tier === 'creative' ? 0.7 : 0.2,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Model ${model} returned HTTP ${response.status}`);

        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const latency = Date.now() - startTime;

        // Fire-and-forget metric log — never blocks the response
        this.logMetric(model, tier, latency, true, 'cloud');

        return {
          model,
          response: data.choices[0]?.message?.content || '',
          latency,
          source: 'cloud',
        };
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error(
          `Tier ${tier}: Model ${model} ${isTimeout ? 'timed out' : 'failed'}, trying fallback...`
        );
        this.logMetric(model, tier, Date.now() - startTime, false, 'cloud');
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error(`All models in tier ${tier} failed to respond.`);
  }

  /**
   * Logs performance metrics to the model_metrics table.
   * Silent-fails so it never disrupts the caller.
   */
  private static async logMetric(
    model: string,
    tier: string,
    latency: number,
    success: boolean,
    source: string
  ) {
    try {
      // model_metrics is a dedicated telemetry table — does NOT mix with treasury data
      await pool.query(
        `INSERT INTO model_metrics (model, tier, latency_ms, success, source, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [model, tier, latency, success, source]
      );
    } catch {
      // Non-critical — silently ignore if table doesn't exist yet
    }
  }
}
