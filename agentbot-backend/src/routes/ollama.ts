import { Router, Request, Response } from 'express';
import OllamaService from '../services/ollama';

const router = Router();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const ollama = new OllamaService(OLLAMA_URL);

// Health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const healthy = await ollama.isHealthy();
    if (healthy) {
      res.json({ status: 'healthy', url: OLLAMA_URL, timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'unhealthy', url: OLLAMA_URL, error: 'Ollama not responding' });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// List available models
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const models = await ollama.listModels();
    res.json({
      models,
      count: models.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list models' });
  }
});

// Pull a model
router.post('/models/pull', async (req: Request, res: Response) => {
  const { model } = req.body as { model?: string };

  if (!model) {
    return res.status(400).json({ error: 'Model name is required' });
  }

  try {
    res.json({ status: 'pulling', model, message: `Pulling model ${model}...` });
    // Non-blocking pull - return immediately and pull in background
    ollama.pullModel(model).catch((err) => {
      console.error(`Failed to pull model ${model}:`, err);
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to pull model' });
  }
});

// Chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
  const { messages, model, temperature, top_p, top_k, taskType } = req.body as {
    messages?: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    taskType?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  if (messages.length === 0) {
    return res.status(400).json({ error: 'Messages array cannot be empty' });
  }

  try {
    // Use provided model or select best one based on task type
    let selectedModel = model;
    if (!selectedModel) {
      selectedModel = await ollama.selectBestModel(taskType);
    }

    const response = await ollama.chat(messages, selectedModel, {
      temperature,
      top_p,
      top_k,
    });

    res.json({
      id: `ollama-${Date.now()}`,
      model: selectedModel,
      choices: [
        {
          message: {
            role: 'assistant',
            content: response.message.content,
          },
        },
      ],
      usage: {
        prompt_tokens: response.prompt_eval_count,
        completion_tokens: response.eval_count,
        total_tokens: response.prompt_eval_count + response.eval_count,
      },
      metadata: {
        total_duration: response.total_duration,
        load_duration: response.load_duration,
        eval_duration: response.eval_duration,
        prompt_eval_duration: response.prompt_eval_duration,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ollama chat error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Chat failed' });
  }
});

// Generate endpoint (simple text generation)
router.post('/generate', async (req: Request, res: Response) => {
  const { prompt, model } = req.body as { prompt?: string; model?: string };

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    let selectedModel = model;
    if (!selectedModel) {
      selectedModel = await ollama.selectBestModel('general');
    }

    const response = await ollama.generate(prompt, selectedModel);

    res.json({
      id: `ollama-gen-${Date.now()}`,
      model: selectedModel,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ollama generate error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Generation failed' });
  }
});

// Select best model based on task type
router.post('/models/select', async (req: Request, res: Response) => {
  const { taskType } = req.body as { taskType?: string };

  try {
    const model = await ollama.selectBestModel(taskType);
    res.json({
      model,
      taskType: taskType || 'general',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to select model' });
  }
});

export default router;
