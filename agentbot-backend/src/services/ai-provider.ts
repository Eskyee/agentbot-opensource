import dotenv from 'dotenv';

dotenv.config();

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

export class AIProviderService {
  private static OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  private static OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

  /**
   * Check which providers are available
   */
  static async checkProviders(): Promise<{
    openrouter: boolean;
  }> {
    return {
      openrouter: !!this.OPENROUTER_API_KEY,
    };
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
        headers: {
          Authorization: `Bearer ${this.OPENROUTER_API_KEY}`,
        },
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

      const models = data.data || [];

      return models.map((m) => ({
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
  static async selectBestModel(
    taskType: string = 'general',
  ): Promise<AvailableModel | null> {
    const allModels = await this.getAllModels();

    const taskMap: Record<string, string[]> = {
      coding: ['coding', 'logic'],
      analysis: ['analysis'],
      creative: ['creative'],
      long: ['long-context'],
      general: ['general', 'balanced'],
    };

    const tags = taskMap[taskType] || taskMap.general;

    const match = allModels.find((m) =>
      m.tags.some((tag) => tags.includes(tag))
    );

    return match || allModels[0] || null;
  }

  /**
   * Send message to OpenRouter
   */
  static async chat(
    messages: AIMessage[],
    modelId: string,
    options?: {
      temperature?: number;
      top_p?: number;
      max_tokens?: number;
    }
  ): Promise<AIResponse> {
    return this.chatOpenRouter(messages, modelId, options);
  }

  /**
   * Chat with OpenRouter
   */
  private static async chatOpenRouter(
    messages: AIMessage[],
    modelId: string,
    options?: { temperature?: number; top_p?: number; max_tokens?: number }
  ): Promise<AIResponse> {
    if (!this.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

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
  }

  /**
   * Get cost estimate for a message
   */
  static async estimateCost(modelId: string, inputTokens: number, outputTokens: number): Promise<number> {
    const models = await this.getAllModels();
    const model = models.find((m) => m.id === modelId);

    if (!model || !model.inputCost || !model.outputCost) {
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * model.inputCost;
    const outputCost = (outputTokens / 1_000_000) * model.outputCost;

    return inputCost + outputCost;
  }
}

export default AIProviderService;
