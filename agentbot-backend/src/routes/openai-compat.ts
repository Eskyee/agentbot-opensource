import { Router, Request, Response } from 'express';
import AIProviderService from '../services/ai-provider';
import { authenticate } from '../middleware/authenticate';

/**
 * OpenAI-compatible endpoints for RAG/SDK compatibility.
 *
 * Mounts:
 *   GET  /v1/models         — list available models
 *   GET  /v1/models/:model  — describe a single model
 *   POST /v1/embeddings     — proxy to OpenRouter embeddings (auth required)
 */
const openaiCompatRouter = Router();

openaiCompatRouter.get('/v1/models', async (_req: Request, res: Response) => {
  try {
    const models = await AIProviderService.getAllModels();
    res.json({
      object: 'list',
      data: models.map((m: { id: string; name: string; provider: string }) => ({
        id: m.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: m.provider || 'agentbot',
      })),
    });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch models', type: 'server_error' } });
  }
});

openaiCompatRouter.get('/v1/models/:model', async (req: Request, res: Response) => {
  try {
    const models = await AIProviderService.getAllModels();
    const model = models.find((m: { id: string }) => m.id === req.params.model);
    if (!model) {
      return res.status(404).json({ error: { message: `Model ${req.params.model} not found`, type: 'invalid_request_error' } });
    }
    res.json({
      id: model.id,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: model.provider || 'agentbot',
    });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch model', type: 'server_error' } });
  }
});

openaiCompatRouter.post('/v1/embeddings', authenticate, async (req: Request, res: Response) => {
  const { input, model } = req.body as { input?: string | string[]; model?: string };
  if (!input) {
    return res.status(400).json({ error: { message: 'input is required', type: 'invalid_request_error' } });
  }
  // Proxy to OpenRouter embeddings
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: { message: 'Embeddings not configured', type: 'server_error' } });
    }
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, model: model || 'openai/text-embedding-3-small' }),
    });
    const data = await response.json() as Record<string, unknown>;
    res.json(data);
  } catch {
    res.status(500).json({ error: { message: 'Embeddings request failed', type: 'server_error' } });
  }
});

export default openaiCompatRouter;
