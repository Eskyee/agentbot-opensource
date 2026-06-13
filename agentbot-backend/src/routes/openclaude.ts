import { log } from "../lib/logger";
import { Router, Request, Response } from 'express';

const router = Router();

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro';
const VERCEL_AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const GITLAWB_OPENGATEWAY_URL = 'https://opengateway.gitlawb.com/v1/chat/completions'; // openclaude v0.16.1

function getGatewayConfig() {
  const vercelKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_KEY || '';
  const opengatewayKey = process.env.GITLAWB_OPENGATEWAY_API_KEY || process.env.OPENGATEWAY_API_KEY || '';

  if (vercelKey) {
    return {
      provider: 'vercel-ai-gateway',
      url: VERCEL_AI_GATEWAY_URL,
      key: vercelKey,
      model: DEFAULT_MODEL,
    };
  }

  if (opengatewayKey) {
    return {
      provider: 'gitlawb-opengateway',
      url: GITLAWB_OPENGATEWAY_URL,
      key: opengatewayKey,
      model: 'mimo-v2.5-pro',
    };
  }

  return null;
}

function buildSystemPrompt() {
  return `You are OpenClaude inside Agentbot Playground.

Return only valid JSON with:
- title: short project title
- summary: one sentence
- previewHtml: complete standalone HTML document for iframe preview
- files: app files with path, language, content
- console: concise build log lines

Keep generated code safe: no secrets, remote scripts, trackers, or network calls.`;
}

router.get('/health', (_req: Request, res: Response) => {
  const config = getGatewayConfig();
  res.json({
    service: 'openclaude',
    configured: Boolean(config),
    provider: config?.provider ?? null,
    model: config?.model ?? DEFAULT_MODEL,
    timestamp: new Date().toISOString(),
  });
});

router.post('/playground/generate', async (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const requestedModel = typeof req.body?.model === 'string' && req.body.model.trim()
    ? req.body.model.trim()
    : DEFAULT_MODEL;

  if (prompt.length < 12) {
    return res.status(400).json({ error: 'Describe the app in at least 12 characters.' });
  }

  if (prompt.length > 5000) {
    return res.status(400).json({ error: 'Prompt is too long for the playground.' });
  }

  const config = getGatewayConfig();
  if (!config) {
    return res.status(503).json({
      error: 'OpenClaude playground backend is not configured.',
      requiredEnv: ['AI_GATEWAY_API_KEY', 'GITLAWB_OPENGATEWAY_API_KEY'],
    });
  }

  const model = config.provider === 'gitlawb-opengateway'
    ? requestedModel.replace(/^xiaomi\//, '')
    : requestedModel;

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: `Create this app in the playground:\n\n${prompt}` },
        ],
        temperature: 0.35,
      }),
      signal: AbortSignal.timeout(55_000),
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'OpenClaude gateway request failed',
        detail: text.slice(0, 500),
      });
    }

    const data = JSON.parse(text);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(502).json({ error: 'OpenClaude gateway returned no content' });
    }

    res.json({
      provider: config.provider,
      model: requestedModel,
      raw: content,
    });
  } catch (error) {
    log.error('[openclaude] playground generation failed', { error: error instanceof Error ? error.message : String(error) });
    res.status(502).json({ error: error instanceof Error ? error.message : 'OpenClaude generation failed' });
  }
});

export default router;
