import { Router, Request, Response } from 'express';
import AIProviderService from '../services/ai-provider';
import { ALGORITHM_SYSTEM_PROMPT } from '../services/ai';
import { requirePlan, canAccessModel } from '../middleware/plan';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Universal AI Provider Routes
 * Supports: OpenRouter (cloud)
 * Users can choose which provider/model they want
 *
 * Authentication policy:
 *  - All routes that select, use, or reveal cost information require authenticate + requirePlan.
 *  - /health is intentionally public (status page use-case).
 *  - /models and /models/:provider are intentionally public (pricing/discovery use-case)
 *    but return no sensitive data — just model names and capabilities.
 */

// Health check — intentionally public for status monitoring
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

// Model catalogue — intentionally public (used on pricing / discovery pages)
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

// Models by provider — intentionally public
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

// Smart model selection — requires auth (reveals platform routing strategy)
router.post('/models/select', authenticate, requirePlan, async (req: Request, res: Response) => {
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
router.post('/chat', authenticate, requirePlan, async (req: Request, res: Response) => {
  const { messages, model, taskType, temperature, top_p, max_tokens, algorithmMode } = req.body;

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

    // Check model access based on plan
    if (!canAccessModel(selectedModel, req.userPlan!)) {
      return res.status(403).json({
        error: `Model ${selectedModel} not available on your plan. Upgrade for more models.`,
        code: 'MODEL_RESTRICTED',
        allowedModels: req.userPlanConfig?.models,
      });
    }

    // Send to appropriate provider - cast messages to correct type
    const typedMessages = messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;

    // Inject Algorithm system prompt when algorithmMode is enabled
    if (algorithmMode) {
      const hasAlgoPrompt = typedMessages.some(m => m.role === 'system' && m.content.includes('PHASE 1/7'));
      if (!hasAlgoPrompt) {
        typedMessages.unshift({ role: 'system', content: ALGORITHM_SYSTEM_PROMPT });
      }
    }

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

// Cost estimation — requires auth (prevents free enumeration of pricing data)
router.post('/estimate-cost', authenticate, requirePlan, async (req: Request, res: Response) => {
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
