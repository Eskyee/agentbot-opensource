/**
 * Unsigned Transaction Pattern
 * Platform returns unsigned tx data, agent signs with own key, broadcasts, confirms.
 * Zero key exposure — platform never sees private keys.
 */
import { createPublicClient, http, formatEther, type Address, type Hex } from 'viem';
import { base } from 'viem/chains';

// Base chain client for gas estimation
const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

interface UnsignedTx {
  from: Address;
  to: Address;
  data: Hex;
  value: string;
  chainId: number;
  nonce: number;
  gasPrice: string;
  gasEstimate: string;
  unsignedAt: string;
  expiresAt: string;
}

interface PrepareResult {
  success: boolean;
  unsignedTx?: UnsignedTx;
  error?: string;
}

interface ConfirmResult {
  success: boolean;
  confirmed?: boolean;
  txHash?: string;
  error?: string;
}

// Track pending transactions for confirmation
const pendingTxs = new Map<string, { tx: UnsignedTx; confirmedAt?: string }>();

/**
 * Prepare an unsigned transaction for an agent to sign and broadcast
 */
export async function prepareUnsignedTx(
  from: Address,
  to: Address,
  data: Hex,
  value: bigint = 0n,
  chainId: number = 8453 // Base mainnet
): Promise<PrepareResult> {
  try {
    // Validate addresses
    if (!from || !to || from.length !== 42 || to.length !== 42) {
      return { success: false, error: 'Invalid from or to address' };
    }

    // Get nonce and gas estimate
    const [nonce, gasPrice] = await Promise.all([
      baseClient.getTransactionCount({ address: from }),
      baseClient.getGasPrice(),
    ]);

    // Estimate gas (with fallback)
    let gasEstimate: bigint;
    try {
      gasEstimate = await baseClient.estimateGas({
        account: from,
        to,
        data,
        value,
      });
      // Add 20% buffer
      gasEstimate = (gasEstimate * 120n) / 100n;
    } catch {
      gasEstimate = 100_000n; // Fallback
    }

    const unsignedTx: UnsignedTx = {
      from,
      to,
      data,
      value: value.toString(),
      chainId,
      nonce,
      gasPrice: gasPrice.toString(),
      gasEstimate: gasEstimate.toString(),
      unsignedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
    };

    // Store for later confirmation
    const txId = `${from}-${nonce}`;
    pendingTxs.set(txId, { tx: unsignedTx });

    return { success: true, unsignedTx };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

/**
 * Confirm a transaction was broadcast by the agent
 * @param txHash - Transaction hash from the broadcast
 * @param from - Sender address
 * @param nonce - Transaction nonce
 */
export async function confirmTransaction(
  txHash: string,
  from: Address,
  nonce: number
): Promise<ConfirmResult> {
  try {
    const txId = `${from}-${nonce}`;
    const pending = pendingTxs.get(txId);

    if (!pending) {
      return { success: false, error: 'Transaction not found in pending pool' };
    }

    // Check if tx is confirmed on-chain
    const receipt = await baseClient.getTransactionReceipt({
      hash: txHash as Hex,
    }).catch(() => null);

    const confirmed = receipt !== null;

    if (confirmed) {
      pending.confirmedAt = new Date().toISOString();
      pendingTxs.delete(txId);

      return {
        success: true,
        confirmed: true,
        txHash,
      };
    }

    return {
      success: true,
      confirmed: false,
      txHash,
      error: 'Transaction not yet confirmed. Check again later.',
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

/**
 * Get gas cost estimate for a transaction
 */
export async function estimateTxCost(
  to: Address,
  data: Hex,
  value: bigint = 0n
): Promise<{ gasLimit: string; gasPrice: string; totalEth: string; totalUsd: string | null }> {
  const gasEstimate = await baseClient.estimateGas({
    account: '0x0000000000000000000000000000000000000000' as Address,
    to,
    data,
    value,
  }).catch(() => 100_000n);

  const gasPrice = await baseClient.getGasPrice();
  const totalCost = gasEstimate * gasPrice;

  return {
    gasLimit: gasEstimate.toString(),
    gasPrice: gasPrice.toString(),
    totalEth: formatEther(totalCost),
    totalUsd: null, // Requires ETH price feed
  };
}

// Cleanup expired pending transactions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pendingTxs) {
    const expiresAt = new Date(entry.tx.expiresAt).getTime();
    if (now > expiresAt) {
      pendingTxs.delete(key);
    }
  }
}, 5 * 60 * 1000);
