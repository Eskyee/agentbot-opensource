import dotenv from 'dotenv';

dotenv.config();

/**
 * Universal AI Provider Interface
 * Supports: Ollama (local), OpenRouter (cloud), and other providers
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  id: string;
  model: string;
  provider: 'ollama' | 'openrouter' | 'anthropic' | 'openai' | 'groq';
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
  private static OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  private static OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  private static OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

  /**
   * Check which providers are available
   */
  static async checkProviders(): Promise<{
    ollama: boolean;
    openrouter: boolean;
  }> {
    const ollamaHealthy = await this.checkOllamaHealth();
    const openrouterHealthy = !!this.OPENROUTER_API_KEY;

    return {
      ollama: ollamaHealthy,
      openrouter: openrouterHealthy,
    };
  }

  /**
   * Check Ollama health
   */
  private static async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.OLLAMA_URL}/api/tags`, { timeout: 5000 });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get all available models from all providers
   */
  static async getAllModels(): Promise<AvailableModel[]> {
    const models: AvailableModel[] = [];

    // Get Ollama models
    const ollamaModels = await this.getOllamaModels();
    models.push(...ollamaModels);

    // Get OpenRouter models
    const openrouterModels = await this.getOpenRouterModels();
    models.push(...openrouterModels);

    return models;
  }

  /**
   * Get models from Ollama
   */
  private static async getOllamaModels(): Promise<AvailableModel[]> {
    try {
      const response = await fetch(`${this.OLLAMA_URL}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];

      return models.map((m) => ({
        id: m.name,
        name: m.name,
        provider: 'ollama',
        description: `Local Ollama Model: ${m.name}`,
        tags: ['local', 'free', 'open-source'],
        available: true,
      }));
    } catch {
      return [];
    }
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
    preferLocal: boolean = true
  ): Promise<AvailableModel | null> {
    const allModels = await this.getAllModels();

    // Priority map: task type to model characteristics
    const taskMap: Record<string, { tags: string[]; providers: string[] }> = {
      coding: { tags: ['coding', 'logic'], providers: ['openrouter'] },
      analysis: { tags: ['analysis'], providers: ['openrouter', 'ollama'] },
      creative: { tags: ['creative'], providers: ['openrouter'] },
      quick: { tags: ['fast', 'local'], providers: ['ollama'] },
      long: { tags: ['long-context'], providers: ['openrouter'] },
      general: { tags: ['general', 'balanced'], providers: preferLocal ? ['ollama', 'openrouter'] : ['openrouter', 'ollama'] },
    };

    const taskConfig = taskMap[taskType] || taskMap.general;

    // Filter by provider preference
    let candidates = allModels.filter((m) =>
      taskConfig.providers.includes(m.provider)
    );

    // Filter by tags
    if (candidates.length === 0) {
      candidates = allModels.filter((m) =>
        m.tags.some((tag) => taskConfig.tags.includes(tag))
      );
    }

    // Return first available
    return candidates[0] || allModels[0] || null;
  }

  /**
   * Send message to AI provider (auto-detects provider from model ID)
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
    // Determine provider from model ID
    const provider = this.getProviderFromModel(modelId);

    switch (provider) {
      case 'ollama':
        return this.chatOllama(messages, modelId, options);
      case 'openrouter':
        return this.chatOpenRouter(messages, modelId, options);
      default:
        throw new Error(`Unknown provider for model: ${modelId}`);
    }
  }

  /**
   * Determine provider from model ID
   */
  private static getProviderFromModel(modelId: string): string {
    // OpenRouter models contain slashes (e.g., "openai/gpt-4")
    if (modelId.includes('/')) {
      return 'openrouter';
    }
    // Ollama models are simple names
    return 'ollama';
  }

  /**
   * Chat with Ollama
   */
  private static async chatOllama(
    messages: AIMessage[],
    modelId: string,
    options?: { temperature?: number; top_p?: number; max_tokens?: number }
  ): Promise<AIResponse> {
    const response = await fetch(`${this.OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: false,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.top_p ?? 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat failed: ${response.status}`);
    }

    const data = await response.json() as {
      message?: { content: string };
      done?: boolean;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      id: `ollama-${Date.now()}`,
      model: modelId,
      provider: 'ollama',
      message: {
        role: 'assistant',
        content: data.message?.content || '',
      },
      usage: {
        prompt_tokens: data.prompt_eval_count,
        completion_tokens: data.eval_count,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      timestamp: new Date().toISOString(),
    };
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
