/**
 * x402 Tempo — Agent-to-Agent Payment Protocol
 * 
 * Implements the clone pattern: agents pay $1 pathUSD to replicate.
 * Based on tempo-x402 crate (compusophy/tempo-x402)
 */

import { createWalletClient, http, parseEther, formatEther, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Tempo chain config
export const TEMPO_CHAIN = {
  id: 4217,
  name: 'Tempo',
  network: 'tempo',
  nativeCurrency: { name: 'pathUSD', symbol: 'pathUSD', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.TEMPO_RPC_URL || 'https://rpc.tempochain.org'] },
  },
} as const;

// x402 Gateway config
export const X402_GATEWAY_URL = process.env.X402_GATEWAY_URL || 'http://localhost:4023';
export const CLONE_PRICE = '1.0'; // pathUSD

export interface CloneRequest {
  parentAgentId: string;
  name: string;
  specialization?: string;
  metadata?: Record<string, unknown>;
}

export interface CloneResponse {
  success: boolean;
  agentId?: string;
  walletAddress?: Address;
  parentAgentId: string;
  generation: number;
  transactionHash?: string;
  error?: string;
}

export interface PaymentProof {
  transactionHash: string;
  amount: string;
  currency: string;
  chainId: number;
  from: Address;
  to: Address;
  timestamp: number;
}

/**
 * Create a wallet client for agent clone payments
 */
export async function createCloneWalletClient(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: TEMPO_CHAIN,
    transport: http(process.env.TEMPO_RPC_URL || 'https://rpc.tempochain.org'),
  });
}

/**
 * Execute a clone payment: agent pays $1 pathUSD to create a new agent
 */
export async function executeClonePayment(
  privateKey: string,
  recipientAddress: Address
): Promise<PaymentProof> {
  const client = await createCloneWalletClient(privateKey);
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  const amount = parseEther(CLONE_PRICE);
  
  const hash = await client.sendTransaction({
    to: recipientAddress,
    value: amount,
  });
  
  return {
    transactionHash: hash,
    amount: CLONE_PRICE,
    currency: 'pathUSD',
    chainId: TEMPO_CHAIN.id,
    from: account.address,
    to: recipientAddress,
    timestamp: Date.now(),
  };
}

/**
 * Verify a payment proof on-chain
 */
export async function verifyPaymentProof(proof: PaymentProof): Promise<boolean> {
  try {
    // In production, this would verify the transaction on Tempo chain
    // For now, validate structure and chain ID
    if (proof.chainId !== TEMPO_CHAIN.id) return false;
    if (proof.currency !== 'pathUSD') return false;
    if (parseFloat(proof.amount) < parseFloat(CLONE_PRICE)) return false;
    if (!proof.transactionHash.startsWith('0x')) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if x402 gateway is available
 */
export async function checkGatewayHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${X402_GATEWAY_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Request a clone via x402 gateway
 * The gateway handles payment verification and triggers provisioning
 */
export async function requestCloneViaGateway(
  request: CloneRequest,
  paymentProof: PaymentProof
): Promise<CloneResponse> {
  try {
    const response = await fetch(`${X402_GATEWAY_URL}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        paymentProof,
      }),
      signal: AbortSignal.timeout(30000),
    });
    
    if (response.status === 402) {
      return {
        success: false,
        parentAgentId: request.parentAgentId,
        generation: 0,
        error: 'Payment required — connect wallet and try again',
      };
    }
    
    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        parentAgentId: request.parentAgentId,
        generation: 0,
        error: `Gateway error: ${error}`,
      };
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      parentAgentId: request.parentAgentId,
      generation: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get agent's Tempo balance
 */
export async function getAgentTempoBalance(agentWalletAddress: Address): Promise<string> {
  try {
    const response = await fetch(
      `${X402_GATEWAY_URL}/balance/${agentWalletAddress}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!response.ok) return '0';
    
    const data = await response.json();
    return data.balance || '0';
  } catch {
    return '0';
  }
}
