/**
 * x402 Payment Helper for Agentbot SDK.
 *
 * Handles HTTP 402 payment negotiation — signs payment headers
 * and replays the request with the payment attached.
 *
 * Usage:
 *   import { x402 } from '@agentbot/sdk';
 *   const result = await x402.payForRequest({ url, method, body });
 */

import type { X402PaymentRequest, X402PaymentResponse } from './types.js';
import { AgentbotError, PaymentRequiredError } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface X402Config {
  /** Agentbot API key for authentication */
  apiKey?: string;
  /** Base URL for the Agentbot proxy (default: https://agentbot.sh) */
  baseUrl?: string;
  /** Default headers for all requests */
  headers?: Record<string, string>;
}

export interface PayForRequestOptions {
  /** Target URL (the resource you want to pay for) */
  url: string;
  /** HTTP method */
  method?: string;
  /** Request body */
  body?: unknown;
  /** Extra headers */
  headers?: Record<string, string>;
  /** Max amount willing to pay in USD */
  maxAmount?: number;
  /** x402 config overrides */
  config?: X402Config;
}

// ─── Default Config ──────────────────────────────────────────────────────────

let defaultConfig: X402Config = {};

export function configureX402(config: X402Config): void {
  defaultConfig = { ...defaultConfig, ...config };
}

// ─── Payment via Agentbot Proxy ──────────────────────────────────────────────

/**
 * Make a request that may require x402 payment.
 *
 * If the target returns 402, the SDK will:
 * 1. Parse the payment requirements from the response
 * 2. Route through the Agentbot x402 gateway to settle payment
 * 3. Replay the original request with payment proof attached
 *
 * For direct use without the Agentbot proxy, import @x402/core and
 * handle payment signing yourself.
 */
export async function payForRequest(
  options: PayForRequestOptions,
): Promise<X402PaymentResponse> {
  const config = { ...defaultConfig, ...options.config };
  const baseUrl = (config.baseUrl ?? 'https://agentbot.sh').replace(/\/+$/, '');
  const method = options.method?.toUpperCase() ?? 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
    ...options.headers,
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Step 1: Make the initial request
  const initialRes = await fetch(options.url, {
    method,
    headers,
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });

  // If not 402, return as-is
  if (initialRes.status !== 402) {
    if (!initialRes.ok) {
      throw new AgentbotError(
        `Request failed: HTTP ${initialRes.status}`,
        'REQUEST_FAILED',
        initialRes.status,
      );
    }
    const data = await initialRes.json();
    return {
      status: initialRes.status,
      data,
      payment: { amount: 0, token: 'USDC' },
    };
  }

  // Step 2: Parse payment requirements from 402 response
  let paymentRequirements: Record<string, unknown>;
  try {
    paymentRequirements = (await initialRes.json()) as Record<string, unknown>;
  } catch {
    throw new AgentbotError('Invalid 402 response body', 'INVALID_402');
  }

  const requiredAmount = (paymentRequirements.amount as number) ?? 0;
  const maxAmount = options.maxAmount ?? 1.0;

  if (requiredAmount > maxAmount) {
    throw new PaymentRequiredError(
      `Payment of $${requiredAmount} exceeds max of $${maxAmount}`,
      requiredAmount,
      0,
    );
  }

  // Step 3: Route payment through Agentbot's x402 gateway
  const gatewayRes = await fetch(`${baseUrl}/gateway/x402-node/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      targetUrl: options.url,
      method,
      body: options.body,
      requirements: paymentRequirements,
    }),
  });

  if (!gatewayRes.ok) {
    const errBody = await gatewayRes.json().catch(() => ({}));
    throw new AgentbotError(
      (errBody as { error?: string }).error ?? 'x402 settlement failed',
      'X402_SETTLEMENT_FAILED',
      gatewayRes.status,
    );
  }

  const settlement = (await gatewayRes.json()) as {
    data: unknown;
    payment: { amount: number; token: string; txHash?: string };
  };

  return {
    status: 200,
    data: settlement.data,
    payment: settlement.payment,
  };
}

// ─── Auto-Payment Config Helper ──────────────────────────────────────────────

/**
 * Returns a payment config that auto-pays from the agent wallet.
 * Use with `client.mcp.invoke({ ..., payment: x402.auto() })`.
 */
export function auto(maxAmount?: number): { auto: boolean; maxAmount?: number } {
  return { auto: true, maxAmount };
}

// ─── Pricing Helper ──────────────────────────────────────────────────────────

/**
 * Create per-tool pricing config for MCP servers.
 * Use with `new McpServer({ ..., pricing: x402.pricing({...}) })`.
 */
export function pricing(
  tools: Record<string, { price: number; token?: string; network?: string }>,
): Record<string, { price: number; token: string; network: string }> {
  const result: Record<string, { price: number; token: string; network: string }> = {};
  for (const [name, config] of Object.entries(tools)) {
    result[name] = {
      price: config.price,
      token: config.token ?? 'USDC',
      network: config.network ?? 'base',
    };
  }
  return result;
}

// ─── Re-export types ─────────────────────────────────────────────────────────

export type { X402PaymentRequest, X402PaymentResponse };
