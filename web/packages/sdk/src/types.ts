// ─── Core Types ──────────────────────────────────────────────────────────────

export interface AgentbotConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL of the Agentbot API (default: https://agentbot.sh) */
  baseUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retries on 429/5xx (default: 3) */
  retries?: number;
  /** Wallet spending limits */
  wallet?: WalletConfig;
}

export interface WalletConfig {
  maxSpendPerCall?: number;
  maxSpendPerDay?: number;
}

// ─── Chat Types ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  topic?: string;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  reply: string;
  agent: string;
  model?: string;
  usage?: TokenUsage;
  toolCalls?: ToolCall[];
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// ─── Model Types ─────────────────────────────────────────────────────────────

export interface Model {
  id: string;
  name: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

// ─── Agent Types ─────────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  model: string;
  channels: string[];
  skills: string[];
  personality?: PersonalityType;
  subdomain?: string;
  status: 'provisioning' | 'running' | 'stopped' | 'error';
  createdAt: string;
  updatedAt: string;
}

export type PersonalityType = 'basement' | 'selector' | 'A&R' | 'road' | 'label';

export interface CreateAgentRequest {
  name: string;
  model?: string;
  channels?: string[];
  skills?: string[];
  personality?: PersonalityType;
  config?: Record<string, unknown>;
  tier?: 'starter' | 'pro' | 'enterprise';
}

export interface UpdateAgentRequest {
  name?: string;
  model?: string;
  channels?: string[];
  skills?: string[];
  personality?: PersonalityType;
  config?: Record<string, unknown>;
}

// ─── Skill Types ─────────────────────────────────────────────────────────────

export interface Skill {
  name: string;
  version: string;
  description: string;
  tools: SkillTool[];
  mcpServer?: McpServerConfig;
}

export interface SkillTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpServerConfig {
  url: string;
  transport: 'sse' | 'stdio';
}

// ─── Wallet Types ────────────────────────────────────────────────────────────

export interface WalletBalance {
  usdc: number;
  network: string;
  address: string;
}

export interface TransferRequest {
  to: string;
  amount: number;
  token?: string;
}

export interface PaymentRecord {
  id: string;
  service: string;
  tool: string;
  amount: number;
  token: string;
  timestamp: string;
  txHash?: string;
}

export interface SpendLimit {
  daily?: number;
  perCall?: number;
  token?: string;
}

// ─── Health Types ────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  uptime: number;
  services: Record<string, 'up' | 'down'>;
}

// ─── MCP Types ───────────────────────────────────────────────────────────────

export interface McpToolCall {
  service: string;
  tool: string;
  args: Record<string, unknown>;
  payment?: McpPaymentConfig;
}

export interface McpPaymentConfig {
  auto: boolean;
  maxAmount?: number;
  token?: string;
}

export interface McpToolResult {
  data: unknown;
  payment?: {
    amount: number;
    token: string;
    txHash?: string;
  };
}

export interface McpServiceInfo {
  name: string;
  description: string;
  pricePerCall: number;
  tools: SkillTool[];
  network: string;
}

// ─── x402 Types ──────────────────────────────────────────────────────────────

export interface X402PaymentRequest {
  url: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  maxAmount?: number;
}

export interface X402PaymentResponse {
  status: number;
  data: unknown;
  payment: {
    amount: number;
    token: string;
    txHash?: string;
  };
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export class AgentbotError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AgentbotError';
  }
}

export class PaymentRequiredError extends AgentbotError {
  constructor(
    message: string,
    public readonly required: number,
    public readonly balance: number,
  ) {
    super(message, 'PAYMENT_REQUIRED', 402);
    this.name = 'PaymentRequiredError';
  }
}

export class RateLimitError extends AgentbotError {
  constructor(public readonly retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

// ─── Marketplace Types ───────────────────────────────────────────────────────

export interface MarketplaceDiscoverRequest {
  category?: string;
  maxPrice?: number;
  network?: string;
}

export interface MarketplaceDiscoverResponse {
  services: McpServiceInfo[];
}
