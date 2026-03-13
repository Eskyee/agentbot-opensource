import dotenv from 'dotenv';

dotenv.config();

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaService {
  private static OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  /**
   * Fetches models currently pulled/installed on the local Ollama instance.
   */
  static async getLocalModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.OLLAMA_URL}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch from Ollama');
      
      const data = await response.json() as { models?: OllamaModel[] };
      return data.models || [];
    } catch (error) {
      console.error('Ollama local fetch failed:', error);
      return [];
    }
  }

  /**
   * Returns a curated list of "Official" recommended models from the Ollama Library.
   * Categorized by Plan Tier.
   */
  static getOfficialLibrary(): Array<{
    id: string;
    name: string;
    description: string;
    family: string;
    tier: string;
    tags: string[];
    official: boolean;
  }> {
    return [
      {
        id: 'mistral',
        name: 'Mistral 7B (OpenClaw Tuned)',
        description: 'FREE TIER: Fast, lightweight executor for basic automation.',
        family: 'Mistral',
        tier: 'free',
        tags: ['fast', 'free'],
        official: true
      },
      {
        id: 'llama3.3',
        name: 'Llama 3.3 70B (OpenClaw Optimized)',
        description: 'UNDERGROUND TIER: High-performance general assistant.',
        family: 'Llama',
        tier: 'underground',
        tags: ['balanced', 'production'],
        official: true
      },
      {
        id: 'qwen2.5-coder:32b',
        name: 'Qwen 2.5 Coder (OpenClaw Tuned)',
        description: 'COLLECTIVE TIER: Specialized for smart contracts & logic.',
        family: 'Qwen',
        tier: 'collective',
        tags: ['coding', 'logic'],
        official: true
      },
      {
        id: 'deepseek-r1:32b',
        name: 'DeepSeek R1 32B (Reasoning Engine)',
        description: 'LABEL TIER: Maximum intelligence for mission planning.',
        family: 'DeepSeek',
        tier: 'label',
        tags: ['reasoning', 'complex-tasks'],
        official: true
      }
    ];
  }

  /**
   * Triggers a pull of a specific model from the Ollama library.
   * Useful for "One-Click Install" from the Agentbot dashboard.
   */
  static async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.OLLAMA_URL}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ name: modelName, stream: false })
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model ${modelName}`);
    }
  }
}
