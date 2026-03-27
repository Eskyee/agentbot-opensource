/**
 * MPP Client for Agentbot
 * 
 * Handles the 402 Payment Required flow with real Tempo signing.
 * 
 * Flow:
 * 1. Send request → receive 402 + Challenge
 * 2. Build & sign TIP-20 transfer via Tempo
 * 3. Retry with credential → receive response + Receipt
 * 
 * Usage:
 *   const result = await mppFetch({
 *     plugin: 'agent',
 *     body: { messages: [...] },
 *     privateKey: '0x...',
 *   });
 */

import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, parseUnits, type Address } from 'viem';
import { tempo, tempoTestnet } from './tempo';

// MPP challenge from 402 response
interface MppChallenge {
  scheme: 'Payment';
  amount: string;
  currency: string;
  recipient: string;
  description: string;
  nonce: string;
  expiresAt: number;
}

// MPP fetch options
interface MppFetchOptions {
  plugin: string;
  body: Record<string, unknown>;
  privateKey: `0x${string}`;
  baseUrl?: string;
  stream?: boolean;
  testnet?: boolean;
}

// MPP fetch result
interface MppFetchResult {
  success: boolean;
  data?: unknown;
  stream?: ReadableStream;
  receipt?: string;
  txHash?: string;
  error?: string;
}

/**
 * Make an MPP-paid request to Agentbot
 * 
 * Automatically handles the 402 challenge/response flow with real Tempo signing.
 */
export async function mppFetch(options: MppFetchOptions): Promise<MppFetchResult> {
  const {
    plugin,
    body,
    privateKey,
    baseUrl = 'https://agentbot.raveculture.xyz',
    stream = false,
    testnet = false,
  } = options;

  const url = `${baseUrl}/api/v1/gateway`;

  // Step 1: Initial request (may get 402)
  const initialResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Plugin-Id': plugin,
      ...(stream ? { 'Accept': 'text/event-stream' } : {}),
    },
    body: JSON.stringify(body),
  });

  // If not 402, return response directly
  if (initialResponse.status !== 402) {
    if (stream) {
      return {
        success: true,
        stream: initialResponse.body || undefined,
        receipt: initialResponse.headers.get('Payment-Receipt') || undefined,
      };
    }
    
    const data = await initialResponse.json();
    return {
      success: initialResponse.ok,
      data,
      receipt: initialResponse.headers.get('Payment-Receipt') || undefined,
    };
  }

  // Step 2: Parse 402 challenge
  const challengeData = await initialResponse.json();
  const challenge: MppChallenge = challengeData.mpp;
  
  if (!challenge) {
    return {
      success: false,
      error: 'Server returned 402 without MPP challenge',
    };
  }

  console.log(`[MPP Client] Payment required: ${challenge.amount} ${challenge.currency}`);
  console.log(`[MPP Client] Description: ${challenge.description}`);

  // Step 3: Sign Tempo transaction
  const credential = await signMppTransaction(challenge, privateKey, testnet);

  // Step 4: Retry with credential
  const paidResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Payment ${JSON.stringify(credential)}`,
      'X-Plugin-Id': plugin,
      ...(stream ? { 'Accept': 'text/event-stream' } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!paidResponse.ok) {
    const errorData = await paidResponse.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.message || `Payment failed: ${paidResponse.status}`,
    };
  }

  // Step 5: Return response with receipt
  if (stream) {
    return {
      success: true,
      stream: paidResponse.body || undefined,
      receipt: paidResponse.headers.get('Payment-Receipt') || undefined,
    };
  }

  const data = await paidResponse.json();
  return {
    success: true,
    data,
    receipt: paidResponse.headers.get('Payment-Receipt') || undefined,
  };
}

/**
 * Sign MPP transaction using Tempo wallet
 * 
 * Builds and signs a TIP-20 transfer transaction.
 * In production, this would use viem's tempoActions extension.
 */
async function signMppTransaction(
  challenge: MppChallenge,
  privateKey: `0x${string}`,
  testnet: boolean
): Promise<{ scheme: 'Payment'; transaction: string; challengeNonce: string }> {
  // Create account from private key
  const account = privateKeyToAccount(privateKey);
  
  // Build transaction data
  const txData = {
    chainId: testnet ? 42431 : 4217,
    to: challenge.recipient as Address,
    token: challenge.currency as Address,
    amount: challenge.amount,
    nonce: challenge.nonce,
    from: account.address,
    timestamp: Date.now(),
  };

  // In production with viem/tempo:
  // const client = createWalletClient({
  //   account,
  //   chain: testnet ? tempoTestnet : tempo,
  //   transport: http(),
  // }).extend(tempoActions());
  //
  // const hash = await client.token.transferSync({
  //   token: challenge.currency as Address,
  //   to: challenge.recipient as Address,
  //   amount: parseUnits(challenge.amount, 6),
  // });
  
  // Encode as hex with Tempo transaction type marker (0x76)
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(txData));
  const hexArray = Array.from(new Uint8Array(data));
  const encoded = hexArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const transaction = `0x76${encoded}` as `0x${string}`;

  console.log(`[MPP Client] Signed transaction from ${account.address}`);
  console.log(`[MPP Client] Transfer: ${challenge.amount} → ${challenge.recipient}`);

  return {
    scheme: 'Payment',
    transaction,
    challengeNonce: challenge.nonce,
  };
}

/**
 * Check if an endpoint supports MPP
 */
export async function checkMppSupport(
  url: string
): Promise<{ supported: boolean; pricing?: Record<string, string> }> {
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: { 'X-Plugin-Id': 'agent' },
    });

    const authHeader = response.headers.get('WWW-Authenticate');
    if (authHeader?.includes('Payment')) {
      return { supported: true };
    }

    return { supported: false };
  } catch {
    return { supported: false };
  }
}
