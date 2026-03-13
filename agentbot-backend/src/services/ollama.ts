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
  private ollamaUrl: string;

  constructor(url: string = process.env.OLLAMA_URL || 'http://localhost:11434') {
    this.ollamaUrl = url;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch from Ollama');
      
      const data = await response.json() as { models?: OllamaModel[] };
      return data.models || [];
    } catch (error) {
      console.error('Ollama list models failed:', error);
      return [];
    }
  }

  async selectBestModel(taskType?: string): Promise<string> {
    const models = await this.listModels();
    if (models.length === 0) return 'mistral';

    const modelMap: Record<string, string[]> = {
      'coding': ['qwen', 'coder', 'deepseek'],
      'reasoning': ['deepseek', 'llama'],
      'creative': ['neural', 'creative'],
      'fast': ['mistral', 'neural-chat']
    };

    const keywords = modelMap[taskType?.toLowerCase() || 'general'] || ['llama', 'mistral'];
    const match = models.find(m => keywords.some(k => m.model.toLowerCase().includes(k)));
    return match?.model || models[0]?.model || 'mistral';
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    model: string,
    options?: { temperature?: number; top_p?: number; top_k?: number }
  ): Promise<any> {
    const response = await fetch(`${this.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.5,
          top_p: options?.top_p ?? 0.9,
          top_k: options?.top_k ?? 40
        }
      })
    });

    if (!response.ok) throw new Error(`Chat failed with model ${model}`);
    return response.json();
  }

  async generate(prompt: string, model: string): Promise<string> {
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) throw new Error(`Generation failed with model ${model}`);
    const data = await response.json() as { response: string };
    return data.response;
  }

  async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.ollamaUrl}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ name: modelName, stream: false })
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model ${modelName}`);
    }
  }
}

export default OllamaService;
