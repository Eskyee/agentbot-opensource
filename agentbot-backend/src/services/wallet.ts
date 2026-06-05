import CryptoJS from 'crypto-js';
import { CdpClient } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';
import { parseUnits, formatUnits } from 'viem';
import { randomUUID } from 'crypto';
import { pool } from '../lib/db';

dotenv.config();

// Lazy check for WALLET_ENCRYPTION_KEY — we used to `process.exit(1)` on
// import, which crashes consumers (test runners, type-checkers, the Next.js
// build) just for *importing* this file. The check is now deferred to the
// first encrypt/decrypt call so importing the module is side-effect free.
function getEncryptionKey(): string {
  const key = process.env.WALLET_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'WALLET_ENCRYPTION_KEY environment variable must be set. Generate with: openssl rand -hex 32'
    );
  }
  return key;
}

// USDC has 6 decimal places on Base mainnet.
const USDC_DECIMALS = 6;

// Initialize CDP Client lazily (only if credentials provided)
let cdp: CdpClient | null = null;

function getCdpClient(): CdpClient {
  if (!cdp) {
    const apiKeyId = process.env.CDP_API_KEY_NAME;
    const privateKey = process.env.CDP_PRIVATE_KEY;
    const walletSecret = process.env.CDP_WALLET_SECRET;

    if (!apiKeyId || !privateKey || !walletSecret) {
      throw new Error('CDP credentials not configured. Set CDP_API_KEY_NAME, CDP_PRIVATE_KEY, and CDP_WALLET_SECRET environment variables.');
    }

    cdp = new CdpClient({
      apiKeyId,
      apiKeySecret: privateKey.replace(/\\n/g, '\n'),
      walletSecret
    });
  }
  return cdp;
}

type Hex = `0x${string}`;

export class WalletService {
  /**
   * Encrypts sensitive data for storage.
   */
  private static encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, getEncryptionKey()).toString();
  }

  /**
   * Decrypts sensitive data.
   */
  private static decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey());
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Creates a new CDP EVM Server Account on Base Mainnet.
   */
  static async createAgentWallet(userId: number, agentId: number): Promise<{ address: string }> {
    let cdpAccountName: string | null = null;
    let cdpAddress: string | null = null;

    try {
      // 1. Create Server Account
      const client = getCdpClient();
      const account = await client.evm.createAccount({ name: `agent-${agentId}` });
      cdpAccountName = account.name ?? null;
      cdpAddress = account.address;

      // 2. Encrypt and store metadata
      const encryptedMetadata = this.encrypt(JSON.stringify({ address: cdpAddress, name: cdpAccountName }));

      await pool.query(
        'INSERT INTO wallets (user_id, address, wallet_seed_encrypted, network, wallet_type) VALUES ($1, $2, $3, $4, $5)',
        [userId, cdpAddress, encryptedMetadata, 'base', 'cdp']
      );

      return { address: cdpAddress };
    } catch (error) {
      console.error('Account creation failed:', error);

      // Compensation: if we created a CDP account but the DB insert failed,
      // log the orphan so it can be reconciled. CDP accounts cannot be deleted
      // programmatically, so we record the failure for manual cleanup.
      if (cdpAddress && cdpAccountName) {
        console.error(
          `[WalletService] ORPHAN CDP ACCOUNT — address=${cdpAddress} name=${cdpAccountName} userId=${userId} agentId=${agentId}. ` +
          `DB insert failed after on-chain account creation. Record for manual reconciliation.`
        );
        try {
          await pool.query(
            `INSERT INTO treasury_transactions (user_id, type, description, status)
             VALUES ($1, 'orphan_wallet', $2, 'needs_reconciliation')`,
            [userId, JSON.stringify({ address: cdpAddress, name: cdpAccountName, agentId })]
          );
        } catch (logErr) {
          // If even the audit log fails, we've done what we can — the console.error above is the fallback
          console.error('[WalletService] Failed to log orphan wallet:', logErr);
        }
      }

      throw new Error('Failed to create agent account');
    }
  }

  /**
   * Transfers USDC from the agent wallet.
   *
   * Uses an outbox pattern so the on-chain action and the DB record can be
   * reconciled if the process crashes between submitTransaction and the
   * follow-up record:
   *
   *   1. INSERT a row in wallet_transfer_outbox with status='pending'. If the
   *      caller passes an `idempotencyKey` and a row already exists with that
   *      key, we return the recorded tx_hash instead of re-broadcasting.
   *   2. Submit the on-chain transaction.
   *   3. UPDATE the outbox row to status='sent' with the tx_hash.
   *   4. Mirror to treasury_transactions for the dashboard.
   *
   * If step 2 throws, the outbox row is marked 'failed' (not deleted) so the
   * audit trail is preserved. Crashes between 2 and 3 leave the row in
   * 'pending' — a reconciliation job (out of scope for this PR) can scan for
   * stale 'pending' rows and look up by from_address+nonce on chain.
   */
  static async transferUSDC(
    userId: number,
    fromAddress: string,
    toAddress: string,
    amount: number,
    idempotencyKey?: string
  ): Promise<string> {
    // Validate amount before touching any on-chain resources.
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid transfer amount: ${amount}. Must be a positive number.`);
    }
    // Cap precision to USDC's 6 decimals to avoid parseUnits throwing.
    const roundedAmount = Math.round(amount * 1_000_000) / 1_000_000;
    if (roundedAmount <= 0) {
      throw new Error(`Transfer amount rounds to zero after USDC precision (6 decimals).`);
    }
    const amountUnits = parseUnits(roundedAmount.toString(), USDC_DECIMALS);
    const dedupeKey = idempotencyKey ?? randomUUID();

    // Step 1: claim the outbox row. Unique violation on idempotency_key means
    // a previous call already started/completed this transfer.
    let outboxId: number;
    try {
      const insertResult = await pool.query(
        `INSERT INTO wallet_transfer_outbox
           (user_id, from_address, to_address, amount_usdc, amount_units, status, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING id`,
        [String(userId), fromAddress, toAddress, roundedAmount, amountUnits.toString(), dedupeKey]
      );
      outboxId = insertResult.rows[0].id;
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code === '23505') {
        // Idempotent replay — return the prior outcome.
        const existing = await pool.query(
          `SELECT status, tx_hash, error FROM wallet_transfer_outbox WHERE idempotency_key = $1`,
          [dedupeKey]
        );
        const row = existing.rows[0];
        if (row?.status === 'sent' && row.tx_hash) return row.tx_hash;
        if (row?.status === 'failed') {
          throw new Error(`Transfer previously failed: ${row.error ?? 'unknown'}`);
        }
        throw new Error('Transfer already in flight under this idempotency key');
      }
      throw err;
    }

    try {
      // Step 2: submit on-chain. ERC20 transfer encoding:
      //   selector "transfer(address,uint256)" + 32-byte to + 32-byte amount.
      const client = getCdpClient();
      const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Hex;
      const data = `0xa9059cbb${toAddress.replace('0x', '').toLowerCase().padStart(64, '0')}${amountUnits.toString(16).padStart(64, '0')}` as Hex;

      const { transactionHash } = await client.evm.sendTransaction({
        address: fromAddress as Hex,
        transaction: {
          to: usdcAddress,
          value: BigInt(0),
          data: data
        },
        network: 'base'
      });

      // Step 3: mark outbox row sent. If THIS update fails (DB blip), we
      // surface the error — the on-chain tx is already broadcast and the
      // pending row remains for reconciliation.
      await pool.query(
        `UPDATE wallet_transfer_outbox
            SET status = 'sent', tx_hash = $1, updated_at = NOW()
          WHERE id = $2`,
        [transactionHash, outboxId]
      );

      // Step 4: mirror to treasury for the dashboard.
      await pool.query(
        'INSERT INTO treasury_transactions (user_id, type, amount_usdc, tx_hash, description, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, 'transfer', amount, transactionHash, `Transfer to ${toAddress}`, 'confirmed']
      );

      return transactionHash;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('USDC Transfer failed:', error);
      // Best-effort: mark the outbox row failed so future calls with the same
      // idempotency key see the prior failure. If THIS write also fails we
      // log and proceed — the outbox row will simply stay 'pending' and the
      // reconciliation job will catch it.
      try {
        await pool.query(
          `UPDATE wallet_transfer_outbox
              SET status = 'failed', error = $1, updated_at = NOW()
            WHERE id = $2 AND status = 'pending'`,
          [detail.slice(0, 1000), outboxId]
        );
      } catch (auditErr) {
        console.error('USDC Transfer audit-update failed:', auditErr);
      }
      throw new Error(`Failed to transfer USDC: ${detail}`);
    }
  }

  /**
   * Fetches the current USDC balance of a wallet.
   *
   * IMPORTANT: CDP returns `amount` in BASE UNITS (1e-6 USDC). The previous
   * implementation did `Number(amount)` and stored that directly, so a $1.00
   * balance was reported as 1,000,000 in the DB and the dashboard. We now
   * convert to a human-readable decimal via viem's `formatUnits` and parse
   * back to a JS number for the wallets row — numbers are safe up to ~9e15
   * USDC, far above realistic balances.
   */
  static async getBalance(userId: number, address: string): Promise<number> {
    try {
      const client = getCdpClient();
      const result = await client.evm.listTokenBalances({
        address: address as Hex,
        network: 'base'
      });

      // CDP SDK types don't expose token symbol on EvmTokenBalance directly.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usdcBalance = result.balances.find((b: any) => b.token?.symbol?.toUpperCase() === 'USDC');
      let balance = 0;
      if (usdcBalance) {
        // `amount` is base units. Some CDP shapes return string|number|bigint;
        // BigInt() coerces all three correctly.
        const baseUnits = BigInt((usdcBalance as unknown as { amount: string | number | bigint }).amount);
        balance = Number(formatUnits(baseUnits, USDC_DECIMALS));
      }

      await pool.query(
        'UPDATE wallets SET balance_usdc = $1, last_balance_check = CURRENT_TIMESTAMP WHERE address = $2',
        [balance, address]
      );

      return balance;
    } catch (error) {
      console.error('Balance fetch failed:', error);
      throw new Error('Failed to fetch account balance');
    }
  }
}
