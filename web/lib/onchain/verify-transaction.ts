/**
 * On-chain transaction verification
 * Verifies USDC transfers on Base mainnet
 */

import { publicClient } from '@/lib/viem/client';
import { parseAbiItem, formatUnits, type Hash, type Address } from 'viem';

// USDC contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const USDC_DECIMALS = 6;

// ERC20 Transfer event signature
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export interface TransactionVerificationResult {
  verified: boolean;
  error?: string;
  from?: string;
  to?: string;
  amount?: string;
  amountUsdc?: number;
  blockNumber?: bigint;
  blockTimestamp?: number;
}

/**
 * Verify a USDC transfer transaction on Base
 * Checks that the transaction:
 * - Exists and is confirmed
 * - Is a transfer to the expected recipient
 * - Has the expected amount
 * - Was sent from the expected sender (optional)
 */
export async function verifyUsdcTransfer(
  txHash: Hash,
  expectedRecipient: Address,
  expectedAmountUsdc: number,
  expectedSender?: Address
): Promise<TransactionVerificationResult> {
  try {
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    });

    if (!receipt) {
      return { verified: false, error: 'Transaction not found' };
    }

    if (receipt.status !== 'success') {
      return { verified: false, error: 'Transaction failed' };
    }

    // Check if this is a USDC transaction
    if (receipt.to?.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
      // Check logs for USDC transfer events (in case of contract interaction)
      const usdcLogs = receipt.logs.filter(
        (log) => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
      );

      if (usdcLogs.length === 0) {
        return { verified: false, error: 'No USDC transfer in transaction' };
      }
    }

    // Parse Transfer events from USDC contract
    const transferLogs = receipt.logs.filter(
      (log) =>
        log.address.toLowerCase() === USDC_ADDRESS.toLowerCase() &&
        log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event topic
    );

    if (transferLogs.length === 0) {
      return { verified: false, error: 'No Transfer events found' };
    }

    // Find the transfer to the expected recipient
    for (const log of transferLogs) {
      // Decode the Transfer event
      // topics[1] = from address (padded to 32 bytes)
      // topics[2] = to address (padded to 32 bytes)
      // data = amount
      const fromAddress = ('0x' + log.topics[1]?.slice(26)) as Address;
      const toAddress = ('0x' + log.topics[2]?.slice(26)) as Address;
      const amount = BigInt(log.data);
      const amountUsdc = parseFloat(formatUnits(amount, USDC_DECIMALS));

      // Check recipient matches
      if (toAddress.toLowerCase() !== expectedRecipient.toLowerCase()) {
        continue;
      }

      // Check sender if specified
      if (expectedSender && fromAddress.toLowerCase() !== expectedSender.toLowerCase()) {
        continue;
      }

      // Check amount (allow small tolerance for rounding)
      const tolerance = 0.01; // 1 cent tolerance
      if (Math.abs(amountUsdc - expectedAmountUsdc) > tolerance) {
        continue;
      }

      // Get block timestamp
      const block = await publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      });

      return {
        verified: true,
        from: fromAddress.toLowerCase(),
        to: toAddress.toLowerCase(),
        amount: amount.toString(),
        amountUsdc,
        blockNumber: receipt.blockNumber,
        blockTimestamp: Number(block.timestamp),
      };
    }

    // No matching transfer found
    return {
      verified: false,
      error: `No matching USDC transfer to ${expectedRecipient} for ${expectedAmountUsdc} USDC`,
    };
  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Failed to verify transaction',
    };
  }
}

/**
 * Check if a transaction exists and is confirmed
 * Lighter weight check without full verification
 */
export async function isTransactionConfirmed(txHash: Hash): Promise<boolean> {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    });
    return receipt?.status === 'success';
  } catch {
    return false;
  }
}
