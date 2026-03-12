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
  source: 'local' | 'cloud';
}

export class AIService {
  private static OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  private static TIER_CONFIG: Record<ModelTier, { primary: string; fallbacks: string[] }> = {
    reasoning: {
      primary: 'deepseek-r1:32b',
      fallbacks: ['llama3.3', 'kimi-k2.5:cloud']
    },
    coding: {
      primary: 'qwen2.5-coder:32b',
      fallbacks: ['gpt-oss:20b', 'gemini-3-flash-preview:latest']
    },
    fast: {
      primary: 'llama3.3',
      fallbacks: ['mistral', 'minimax-m2.5:cloud']
    },
    creative: {
      primary: 'kimi-k2.5:cloud',
      fallbacks: ['gpt-oss:20b', 'deepseek-r1:32b']
    }
  };

  /**
   * Executes a prompt using the tiered fallback system.
   */
  static async prompt(tier: ModelTier, prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const config = this.TIER_CONFIG[tier];
    const models = [config.primary, ...config.fallbacks];
    const startTime = Date.now();

    for (const model of models) {
      try {
        const response = await fetch(`${this.OLLAMA_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            system: systemPrompt,
            stream: false,
            options: {
              num_ctx: 8192,
              temperature: tier === 'creative' ? 0.7 : 0.2
            }
          }),
        });

        if (!response.ok) throw new Error(`Model ${model} failed`);
        
        const data = await response.json();
        const latency = Date.now() - startTime;
        const source = model.includes('cloud') ? 'cloud' : 'local';

        // Log the success for benchmarking
        await this.logMetric(model, tier, latency, true, source);

        return {
          model,
          response: data.response,
          latency,
          source: source as 'local' | 'cloud'
        };
      } catch (error) {
        console.error(`Tier ${tier}: Model ${model} failed, trying fallback...`);
        await this.logMetric(model, tier, Date.now() - startTime, false, model.includes('cloud') ? 'cloud' : 'local');
      }
    }

    throw new Error(`All models in tier ${tier} failed to respond.`);
  }

  /**
   * Logs performance metrics to the database for the Dashboard.
   */
  private static async logMetric(model: string, tier: string, latency: number, success: boolean, source: string) {
    try {
      await pool.query(
        'INSERT INTO treasury_transactions (type, category, amount_usdc, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        ['ai_metric', 'latency', 0, `Model ${model} (${tier})`, JSON.stringify({ latency, success, source, timestamp: new Date().toISOString() })]
      );
    } catch (e) {
      // Silent fail for metrics
    }
  }
}
