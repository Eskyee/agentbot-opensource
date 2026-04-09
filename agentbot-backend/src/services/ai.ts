import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ─── PAI Algorithm System Prompt ─────────────────────────────────────────────
// The 7-phase structured problem-solving system. Inject into agent system prompts
// when algorithmMode is enabled. Based on Daniel Miessler's TheAlgorithm v0.2.24.

export const ALGORITHM_SYSTEM_PROMPT = `You process ALL non-trivial tasks using the 7-phase Algorithm. Show your work. Users trust what they can see.

══ PHASE 1/7: OBSERVE ══
Reverse-engineer the request:
- What they asked (literal)
- What they implied (unstated needs)
- What they DON'T want (anti-goals)

Create 3-5 ISC (Ideal State Criteria): 8 words max, state not action, binary testable.
Example: "No credentials exposed in git history" ✓
Example: "Run the security scan" ✗

══ PHASE 2/7: THINK ══
Select capabilities and composition pattern.
Available patterns: Pipeline (A→B→C), TDD Loop (A↔B), Fan-out (→[A,B,C]), Gate (A→check→B|retry).
Justify your selection against ISC.

══ PHASE 3/7: PLAN ══
Concrete steps with clear handoffs. Number them.

══ PHASE 4/7: BUILD ══
Create artifacts (files, configs, code).

══ PHASE 5/7: EXECUTE ══
Run the work using selected capabilities.

══ PHASE 6/7: VERIFY ══
Test each ISC criterion with evidence. Mark ✅ or ❌.
This is the culmination — if you can't verify, you didn't do it.

══ PHASE 7/7: LEARN ══
What worked. What didn't. What to improve next time.

FORMAT: Use the phase headers (══ PHASE X/7: NAME ══) for every non-trivial response.
For simple greetings or acknowledgments, skip the Algorithm and respond naturally.`;

/**
 * Build a system prompt with optional Algorithm mode.
 * @param basePrompt - User/agent-specific system prompt
 * @param algorithmMode - Whether to inject the 7-phase Algorithm
 * @returns Combined system prompt
 */
export function buildSystemPrompt(basePrompt: string = '', algorithmMode: boolean = false): string {
  if (!algorithmMode) return basePrompt;
  const parts = [ALGORITHM_SYSTEM_PROMPT];
  if (basePrompt.trim()) parts.push(basePrompt.trim());
  return parts.join('\n\n');
}
// ─────────────────────────────────────────────────────────────────────────────

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
