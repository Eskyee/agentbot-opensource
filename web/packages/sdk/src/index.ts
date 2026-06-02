/**
 * @agentbot/sdk — TypeScript SDK for the Agentbot platform.
 *
 * Provision agents, send messages, manage skills, and handle x402 micropayments.
 */

// ── Client ───────────────────────────────────────────────────────────────────
export { AgentbotClient } from './client.js';

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  AgentbotConfig,
  WalletConfig,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  TokenUsage,
  ToolCall,
  Model,
  Agent,
  PersonalityType,
  CreateAgentRequest,
  UpdateAgentRequest,
  Skill,
  SkillTool,
  McpServerConfig,
  WalletBalance,
  TransferRequest,
  PaymentRecord,
  SpendLimit,
  HealthStatus,
  McpToolCall,
  McpToolResult,
  McpServiceInfo,
  X402PaymentRequest,
  X402PaymentResponse,
  MarketplaceDiscoverRequest,
  MarketplaceDiscoverResponse,
} from './types.js';

// ── Errors ───────────────────────────────────────────────────────────────────
export {
  AgentbotError,
  PaymentRequiredError,
  RateLimitError,
} from './types.js';

// ── Re-export MCP client for convenience ─────────────────────────────────────
export { McpClient, McpServer } from './mcp.js';
export type {
  McpClientConfig,
  McpServerInfo,
  CallToolOptions,
  CallToolResult,
  ActivateOptions,
  DeactivateOptions,
} from './mcp.js';

// ── Re-export x402 helpers for convenience ───────────────────────────────────
export * as x402 from './x402.js';
