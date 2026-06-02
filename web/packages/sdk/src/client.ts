import type {
  AgentbotConfig,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Model,
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  Skill,
  WalletBalance,
  TransferRequest,
  PaymentRecord,
  SpendLimit,
  HealthStatus,
  McpToolCall,
  McpToolResult,
  McpServiceInfo,
  MarketplaceDiscoverRequest,
  AgentbotError as AgentbotErrorType,
} from './types.js';
import {
  AgentbotError,
  PaymentRequiredError,
  RateLimitError,
} from './types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── AgentbotClient ──────────────────────────────────────────────────────────

export class AgentbotClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: AgentbotConfig) {
    if (!config.apiKey) throw new AgentbotError('apiKey is required', 'MISSING_API_KEY');
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://agentbot.sh').replace(/\/+$/, '');
    this.timeout = config.timeout ?? 30_000;
    this.retries = config.retries ?? 3;
  }

  // ── Generic request ──────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { retries?: number; stream?: false },
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const maxRetries = opts?.retries ?? this.retries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: body != null ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('Retry-After')) || 1;
          if (attempt < maxRetries) {
            await delay(retryAfter * 1000);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }

        if (res.status === 402) {
          const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          throw new PaymentRequiredError(
            (errBody.error as string) ?? 'Payment required',
            (errBody.required as number) ?? 0,
            (errBody.balance as number) ?? 0,
          );
        }

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          throw new AgentbotError(
            (errBody.error as string) ?? `HTTP ${res.status}`,
            (errBody.code as string) ?? 'API_ERROR',
            res.status,
          );
        }

        return (await res.json()) as T;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof AgentbotError) throw err;
        if (attempt < maxRetries) {
          await delay(2 ** attempt * 500);
          continue;
        }
        throw new AgentbotError(
          err instanceof Error ? err.message : 'Request failed',
          'NETWORK_ERROR',
        );
      }
    }

    // Unreachable — but TS needs it
    throw new AgentbotError('Max retries exceeded', 'MAX_RETRIES');
  }

  private async requestStream(
    path: string,
    body: unknown,
  ): AsyncGenerator<StreamChunk> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      throw new AgentbotError(
        (errBody.error as string) ?? `HTTP ${res.status}`,
        (errBody.code as string) ?? 'API_ERROR',
        res.status,
      );
    }

    const reader = res.body?.getReader();
    if (!reader) throw new AgentbotError('No response body', 'STREAM_ERROR');

    const decoder = new TextDecoder();

    async function* generate(): AsyncGenerator<StreamChunk> {
      while (true) {
        const { done, value } = await reader!.read();
        if (done) {
          yield { text: '', done: true };
          return;
        }
        const text = decoder.decode(value, { stream: true });
        // Parse SSE lines
        for (const line of text.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              yield { text: '', done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield { text: content, done: false };
            } catch {
              // raw text chunk
              yield { text: data, done: false };
            }
          }
        }
      }
    }

    return generate();
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('POST', '/api/chat', request);
  }

  async chatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    return this.requestStream('/api/chat', { ...request, stream: true });
  }

  // ── Models ───────────────────────────────────────────────────────────────

  async models(): Promise<Model[]> {
    const res = await this.request<{ data?: Model[]; models?: Model[] } | Model[]>(
      'GET',
      '/api/models',
    );
    if (Array.isArray(res)) return res;
    return res.data ?? res.models ?? [];
  }

  // ── Agents ───────────────────────────────────────────────────────────────

  agents = {
    create: (req: CreateAgentRequest) =>
      this.request<Agent>('POST', '/api/agents/provision', req),

    list: () =>
      this.request<Agent[]>('GET', '/api/agents'),

    get: (id: string) =>
      this.request<Agent>('GET', `/api/agents/${id}`),

    update: (id: string, req: UpdateAgentRequest) =>
      this.request<Agent>('PATCH', `/api/agents/${id}`, req),

    delete: (id: string) =>
      this.request<{ success: boolean }>('DELETE', `/api/agents/${id}`),

    message: (id: string, req: ChatRequest) =>
      this.request<ChatResponse>('POST', `/api/agents/${id}/chat`, req),

    stream: async function* (this: AgentbotClient, id: string, req: ChatRequest) {
      return this.requestStream(`/api/agents/${id}/chat`, { ...req, stream: true });
    }.bind(this),
  };

  // ── Skills ───────────────────────────────────────────────────────────────

  skills = {
    list: (agentId: string) =>
      this.request<Skill[]>('GET', `/api/agents/${agentId}/skills`),

    install: (agentId: string, skillName: string) =>
      this.request<{ success: boolean }>('POST', `/api/agents/${agentId}/skills`, { name: skillName }),

    uninstall: (agentId: string, skillName: string) =>
      this.request<{ success: boolean }>('DELETE', `/api/agents/${agentId}/skills/${skillName}`),

    get: (skillName: string) =>
      this.request<Skill>('GET', `/api/skills/${skillName}`),
  };

  // ── Wallet ───────────────────────────────────────────────────────────────

  wallet = {
    balance: (agentId: string) =>
      this.request<WalletBalance>('GET', `/api/agents/${agentId}/wallet`),

    transfer: (agentId: string, req: TransferRequest) =>
      this.request<{ txHash: string }>('POST', `/api/agents/${agentId}/wallet/transfer`, req),

    deposit: (agentId: string, req: { amount: number; token?: string; network?: string }) =>
      this.request<{ address: string; memo?: string }>('POST', `/api/agents/${agentId}/wallet/deposit`, req),

    payments: (agentId: string, opts?: { since?: Date; limit?: number }) =>
      this.request<PaymentRecord[]>('GET', `/api/agents/${agentId}/wallet/payments${opts?.since ? `?since=${opts.since.toISOString()}` : ''}${opts?.limit ? `&limit=${opts.limit}` : ''}`),

    setSpendLimit: (agentId: string, limit: SpendLimit) =>
      this.request<{ success: boolean }>('POST', `/api/agents/${agentId}/wallet/limit`, limit),
  };

  // ── MCP ──────────────────────────────────────────────────────────────────

  mcp = {
    invoke: (req: McpToolCall) =>
      this.request<McpToolResult>('POST', '/api/mcp/invoke', req),
  };

  // ── Marketplace ──────────────────────────────────────────────────────────

  marketplace = {
    discover: (req?: MarketplaceDiscoverRequest) =>
      this.request<{ services: McpServiceInfo[] }>('POST', '/api/marketplace/discover', req ?? {}),
  };

  // ── Health ───────────────────────────────────────────────────────────────

  async health(): Promise<HealthStatus> {
    return this.request<HealthStatus>('GET', '/api/health');
  }
}
