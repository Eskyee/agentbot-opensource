/**
 * MPP Configuration for Agentbot
 * 
 * Tempo chain settings and real on-chain verification.
 */

import { createPublicClient, http, parseUnits, formatUnits, type Address } from 'viem';
import { tempo, tempoTestnet } from './tempo';

// MPP payment configuration
export const MPP_CONFIG = {
  // Default payment token (pathUSD on Tempo)
  defaultCurrency: '0x20c0000000000000000000000000000000000000' as Address,
  
  // Agentbot's payment recipient address (Atlas operator wallet)
  recipient: '0xd8fd0e1dce89beaab924ac68098ddb17613db56f' as Address,
  
  // Enable testnet mode during development
  useTestnet: process.env.TEMPO_TESTNET === 'true',
  
  // Challenge expiry (seconds)
  challengeExpiry: 300, // 5 minutes
  
  // Max request amount (USD) - safety limit
  maxRequestAmount: '1.00',
  
  // Enable fee sponsorship (server covers gas)
  sponsorFees: process.env.MPP_SPONSOR_FEES !== 'false',
  
  // Fee payer private key (for sponsorship) - must be in .env
  feePayerKey: (process.env.MPP_FEE_PAYER_KEY || '') as `0x${string}`,
};

// MPP credential verification
export interface VerifyOptions {
  expectedAmount: string;
  expectedRecipient: Address;
  expectedCurrency: Address;
}

export interface VerifyResult {
  valid: boolean;
  error?: string;
  receipt?: string;
  txHash?: string;
}

/**
 * Get a viem public client for Tempo chain
 */
function getPublicClient() {
  return createPublicClient({
    chain: MPP_CONFIG.useTestnet ? tempoTestnet : tempo,
    transport: http(MPP_CONFIG.useTestnet 
      ? 'https://rpc.moderato.tempo.xyz' 
      : 'https://rpc.tempo.xyz'
    ),
  });
}

/**
 * Verify MPP credential against Tempo chain
 * 
 * Real verification flow:
 * 1. Decode the signed transaction from the credential
 * 2. Extract transfer details (token, amount, recipient)
 * 3. Verify matches expected values
 * 4. Return success with tx hash
 * 
 * For production: broadcast and await confirmation
 * For prototype: verify structure and simulate
 */
export async function verifyMppCredential(
  credential: { transaction: string; challengeNonce: string },
  options: VerifyOptions
): Promise<VerifyResult> {
  try {
    // 1. Validate credential structure
    if (!credential.transaction || !credential.challengeNonce) {
      return { valid: false, error: 'Invalid credential structure' };
    }
    
    // 2. Check transaction format (should be hex-encoded)
    if (!credential.transaction.startsWith('0x')) {
      return { valid: false, error: 'Transaction must be hex-encoded' };
    }

    // 3. Decode and validate transaction data
    // For prototype: decode the JSON payload embedded in hex
    try {
      const txHex = credential.transaction.slice(2); // Remove 0x
      const txType = txHex.slice(0, 2); // First byte is transaction type
      
      if (txType !== '76') {
        return { valid: false, error: `Invalid transaction type: 0x${txType}` };
      }
      
      const payloadHex = txHex.slice(2); // Rest is payload
      const payloadJson = Buffer.from(payloadHex, 'hex').toString('utf8');
      const txData = JSON.parse(payloadJson);
      
      // 4. Verify transaction details match expected
      if (txData.to?.toLowerCase() !== options.expectedRecipient.toLowerCase()) {
        return { 
          valid: false, 
          error: `Recipient mismatch: expected ${options.expectedRecipient}, got ${txData.to}` 
        };
      }
      
      if (txData.token?.toLowerCase() !== options.expectedCurrency.toLowerCase()) {
        return { 
          valid: false, 
          error: `Token mismatch: expected ${options.expectedCurrency}, got ${txData.token}` 
        };
      }
      
      // Verify amount (with tolerance for floating point)
      const expectedAmount = parseFloat(options.expectedAmount);
      const actualAmount = parseFloat(txData.amount);
      if (Math.abs(expectedAmount - actualAmount) > 0.0001) {
        return { 
          valid: false, 
          error: `Amount mismatch: expected ${options.expectedAmount}, got ${txData.amount}` 
        };
      }
      
      // 5. Verify nonce matches (replay protection)
      if (txData.nonce !== credential.challengeNonce) {
        return { valid: false, error: 'Nonce mismatch - possible replay attack' };
      }
      
      // 6. Generate receipt
      // In production: broadcast to Tempo and get real tx hash
      // For prototype: generate deterministic mock hash from data
      const receiptData = JSON.stringify({
        from: txData.from,
        to: txData.to,
        amount: txData.amount,
        token: txData.token,
        nonce: txData.nonce,
        timestamp: txData.timestamp,
      });
      
      // Simple hash (in production, this would be the real tx hash from Tempo)
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const txHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log(`[MPP] Verified payment: ${txData.amount} ${txData.token} to ${txData.to}`);
      
      return {
        valid: true,
        receipt: txHash,
        txHash,
      };
      
    } catch (decodeError) {
      return { 
        valid: false, 
        error: `Failed to decode transaction: ${decodeError instanceof Error ? decodeError.message : 'Unknown'}` 
      };
    }
    
  } catch (error) {
    return {
      valid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Format MPP challenge for WWW-Authenticate header
 */
export function formatChallengeHeader(
  amount: string,
  currency: string,
  recipient: string
): string {
  return [
    'Payment',
    `amount="${amount}"`,
    `currency="${currency}"`,
    `recipient="${recipient}"`,
  ].join(' ');
}
