import { Router, Request, Response } from 'express';
import AIProviderService from '../services/ai-provider';

const router = Router();

/**
 * Universal AI Provider Routes
 * Supports: OpenRouter (cloud)
 * Users can choose which provider/model they want
 */

// Health check - show which providers are available
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const providers = await AIProviderService.checkProviders();
    const status = providers.openrouter ? 'healthy' : 'degraded';

    res.json({
      status,
      providers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all available models from all providers
router.get('/models', async (_req: Request, res: Response) => {
  try {
    const models = await AIProviderService.getAllModels();

    res.json({
      models,
      count: models.length,
      openrouter: models.filter((m) => m.provider === 'openrouter').length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch models' });
  }
});

// Get models from specific provider
router.get('/models/:provider', async (req: Request, res: Response) => {
  const { provider } = req.params;

  try {
    const allModels = await AIProviderService.getAllModels();
    const filtered = allModels.filter((m) => m.provider === provider);

    res.json({
      provider,
      models: filtered,
      count: filtered.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch models' });
  }
});

// Smart model selection
router.post('/models/select', async (req: Request, res: Response) => {
  const { taskType } = req.body as { taskType?: string };

  try {
    const model = await AIProviderService.selectBestModel(taskType || 'general');

    if (!model) {
      return res.status(404).json({ error: 'No models available' });
    }

    res.json({
      model,
      taskType: taskType || 'general',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to select model' });
  }
});

// Universal chat endpoint - works with any provider
router.post('/chat', async (req: Request, res: Response) => {
  const { messages, model, taskType, temperature, top_p, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // Determine which model to use
    let selectedModel = model;
    if (!selectedModel) {
      const bestModel = await AIProviderService.selectBestModel(taskType || 'general');
      if (!bestModel) {
        return res.status(404).json({ error: 'No models available' });
      }
      selectedModel = bestModel.id;
    }

    // Send to appropriate provider - cast messages to correct type
    const typedMessages = messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    const response = await AIProviderService.chat(typedMessages, selectedModel, {
      temperature,
      top_p,
      max_tokens,
    });

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Chat failed' });
  }
});

// Cost estimation
router.post('/estimate-cost', async (req: Request, res: Response) => {
  const { model, inputTokens, outputTokens } = req.body as {
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
  };

  if (!model || typeof inputTokens !== 'number' || typeof outputTokens !== 'number') {
    return res.status(400).json({ error: 'Model, inputTokens, and outputTokens are required' });
  }

  try {
    const cost = await AIProviderService.estimateCost(model, inputTokens, outputTokens);

    res.json({
      model,
      inputTokens,
      outputTokens,
      estimatedCost: cost,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to estimate cost' });
  }
});

export default router;
