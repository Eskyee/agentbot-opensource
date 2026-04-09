import CryptoJS from 'crypto-js';
import { CdpClient } from '@coinbase/cdp-sdk';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { parseUnits } from 'viem';

dotenv.config();

// Refuse to start without encryption key in ALL environments — wallet data is always sensitive
if (!process.env.WALLET_ENCRYPTION_KEY) {
  console.error('FATAL: WALLET_ENCRYPTION_KEY environment variable must be set. Generate with: openssl rand -hex 32');
  process.exit(1);
}
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypts sensitive data.
   */
  private static decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
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
      cdpAccountName = account.name;
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
   */
  static async transferUSDC(
    userId: number,
    fromAddress: string,
    toAddress: string,
    amount: number
  ): Promise<string> {
    // Validate amount before touching any on-chain resources
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid transfer amount: ${amount}. Must be a positive number.`);
    }
    // USDC has 6 decimal places — cap precision to avoid parseUnits throwing
    const roundedAmount = Math.round(amount * 1_000_000) / 1_000_000;
    if (roundedAmount <= 0) {
      throw new Error(`Transfer amount rounds to zero after USDC precision (6 decimals).`);
    }

    try {
      // 1. Build USDC transfer transaction (ERC20 transfer)
      // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
      const client = getCdpClient();
      const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Hex;
      const amountUnits = parseUnits(roundedAmount.toString(), 6);
      
      // Data: selector (transfer) + to (padded) + amount (padded)
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

      // 2. Record in treasury
      await pool.query(
        'INSERT INTO treasury_transactions (user_id, type, amount_usdc, tx_hash, description, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, 'transfer', amount, transactionHash, `Transfer to ${toAddress}`, 'confirmed']
      );

      return transactionHash;
    } catch (error) {
      console.error('USDC Transfer failed:', error);
      throw new Error('Failed to transfer USDC');
    }
  }

  /**
   * Fetches the current USDC balance of a wallet.
   */
  static async getBalance(userId: number, address: string): Promise<number> {
    try {
      const client = getCdpClient();
      const result = await client.evm.listTokenBalances({
        address: address as Hex,
        network: 'base'
      });
      
      // Find USDC in the balances array
      // CDP SDK types don't expose token symbol on EvmTokenBalance directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usdcBalance = result.balances.find((b: any) => b.token?.symbol?.toUpperCase() === 'USDC');
      const balance = usdcBalance ? Number(usdcBalance.amount) : 0;
      
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
