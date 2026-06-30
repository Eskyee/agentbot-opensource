import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { calculateCost } from '@/lib/usage-logger';

export type GatewayAuth = {
  keyId: string;
  userId: string;
  keyPrefix: string;
};

export type UpstreamConfig = {
  baseUrl: string;
  apiKey: string;
  provider: string;
  headers?: Record<string, string>;
};

type UsageLike = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

const DEFAULT_MODELS = [
  'mimo-v2.5-pro',
  'mimo-v2.5',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-fable-5',
  'anthropic/claude-fable-latest',
  'google/gemini-2.5-flash',
  'deepseek/deepseek-r1',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen3.7-plus',
  'moonshot/kimi-k2.5',
  'sakana/fugu-ultra',
  'nex-agi/nex-n2-pro:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
];

const MIMO_BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1';
const MIMO_API_KEY = process.env.MIMO_API_KEY || '';

export function gatewayCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization,content-type,x-agentbot-key',
  };
}

export function openAiError(message: string, status: number, code = 'gateway_error') {
  return Response.json(
    {
      error: {
        message,
        type: status === 401 ? 'authentication_error' : 'invalid_request_error',
        code,
      },
    },
    { status, headers: gatewayCorsHeaders() }
  );
}

export function extractBearer(headers: Headers): string | null {
  const authorization = headers.get('authorization') || headers.get('x-agentbot-key') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const key = match?.[1] || authorization;
  return key.trim() || null;
}

export async function authenticateGatewayRequest(headers: Headers): Promise<GatewayAuth | null> {
  const rawKey = extractBearer(headers);
  if (!rawKey) return null;

  const candidatePrefixes = Array.from(new Set([rawKey.slice(0, 18), rawKey.slice(0, 10)])).filter(
    Boolean
  );

  const candidates = await prisma.apiKey.findMany({
    where: {
      OR: candidatePrefixes.map((keyPrefix) => ({ keyPrefix })),
    },
    select: { id: true, userId: true, keyHash: true, keyPrefix: true },
    take: 20,
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(rawKey, candidate.keyHash)) {
      await prisma.apiKey
        .update({
          where: { id: candidate.id },
          data: { lastUsed: new Date() },
        })
        .catch(() => undefined);

      return {
        keyId: candidate.id,
        userId: candidate.userId,
        keyPrefix: candidate.keyPrefix,
      };
    }
  }

  return null;
}

export function resolveGatewayUpstreams(): UpstreamConfig[] {
  const upstreams: UpstreamConfig[] = [];
  const genericBaseUrl = process.env.AGENTBOT_GATEWAY_UPSTREAM_BASE_URL?.trim();
  const genericKey = process.env.AGENTBOT_GATEWAY_UPSTREAM_API_KEY?.trim();
  if (genericBaseUrl && genericKey) {
    upstreams.push({
      baseUrl: genericBaseUrl.replace(/\/+$/, ''),
      apiKey: genericKey,
      provider: 'agentbot-upstream',
    });
  }

  const vercelKey =
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_AI_GATEWAY_KEY?.trim();
  if (vercelKey) {
    upstreams.push({
      baseUrl: 'https://ai-gateway.vercel.sh/v1',
      apiKey: vercelKey,
      provider: 'vercel-ai-gateway',
    });
  }

  // Direct MiMo upstream — subscription BYOK (fastest, zero extra cost)
  if (MIMO_API_KEY) {
    upstreams.push({
      baseUrl: MIMO_BASE_URL,
      apiKey: MIMO_API_KEY,
      provider: 'xiaomi-direct',
    });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    upstreams.push({
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: openRouterKey,
      provider: 'openrouter',
    });
  }

  return upstreams;
}

export function resolveGatewayUpstream(): UpstreamConfig | null {
  return resolveGatewayUpstreams()[0] ?? null;
}

export function gatewayUpstreamHeaders(upstream: UpstreamConfig, title = 'Agentbot') {
  const referer = process.env.NEXTAUTH_URL || 'https://agentbot.sh';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${upstream.apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': referer,
    'X-Title': title,
  };

  if (upstream.provider === 'openrouter') {
    headers['X-OpenRouter-Title'] = title;
    headers['X-OpenRouter-Categories'] = 'cli-agent,cloud-agent';
  }

  return headers;
}

export function shouldTryNextGatewayUpstream(status: number): boolean {
  return status === 401 || status === 403 || status === 404 || status === 429 || status >= 500;
}

export function normalizeGatewayModel(model: string, provider: string): string {
  const trimmed = model.trim();
  if (!trimmed) return 'mimo-v2.5-pro';

  // Direct MiMo — use model ID as-is (subscription handles it)
  if (provider === 'xiaomi-direct') {
    return trimmed;
  }

  if (provider === 'vercel-ai-gateway') {
    if (trimmed === 'mimo-v2.5-pro') return 'xiaomi/mimo-v2.5-pro';
  }

  if (provider === 'openrouter') {
    if (trimmed === 'mimo-v2.5-pro') return 'xiaomi/mimo-v2.5-pro';
  }

  return trimmed;
}

export async function listGatewayModels() {
  const upstream = resolveGatewayUpstream();
  if (!upstream) {
    return DEFAULT_MODELS.map((id) => ({
      id,
      object: 'model',
      created: 0,
      owned_by: id.includes('/') ? id.split('/')[0] : 'agentbot',
    }));
  }

  const response = await fetch(`${upstream.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${upstream.apiKey}` },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (!response?.ok) {
    return DEFAULT_MODELS.map((id) => ({
      id,
      object: 'model',
      created: 0,
      owned_by: id.includes('/') ? id.split('/')[0] : 'agentbot',
    }));
  }

  const data = await response.json();
  return Array.isArray(data?.data) ? data.data : [];
}

export function estimateTokens(value: unknown): number {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return Math.max(1, Math.ceil(text.length / 4));
}

export function extractUsage(
  data: unknown,
  requestBody: unknown
): { inputTokens: number; outputTokens: number } {
  const record = data && typeof data === 'object' ? (data as { usage?: UsageLike }) : {};
  const usage = record.usage || {};
  const inputTokens = usage.prompt_tokens ?? usage.promptTokens ?? estimateTokens(requestBody);
  const outputTokens = usage.completion_tokens ?? usage.completionTokens ?? estimateTokens(data);
  return { inputTokens, outputTokens };
}

export function recordGatewayUsage(params: {
  auth: GatewayAuth | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  endpoint: string;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
}) {
  const costUsd = calculateCost(params.model, params.inputTokens, params.outputTokens);

  prisma.usage_logs
    .create({
      data: {
        user_id: params.auth?.userId ?? 'anonymous',
        agent_id: params.auth?.keyId ?? 'x402',
        model: params.model,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        cost_usd: costUsd,
        endpoint: params.endpoint,
        latency_ms: params.latencyMs,
        success: params.success,
        error_message: params.errorMessage ?? null,
      },
    })
    .catch((error: unknown) => {
      console.error('[opengateway] usage log failed', error);
    });
}
