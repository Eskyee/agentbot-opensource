import CryptoJS from 'crypto-js';
import { CdpClient } from '@coinbase/cdp-sdk';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { parseUnits } from 'viem';

dotenv.config();

const ENCRYPTION_KEY = (() => {
  const key = process.env.WALLET_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WALLET_ENCRYPTION_KEY must be set in production');
    }
    console.warn('[Wallet] Using dev-only encryption key. NEVER use this in production.');
    return 'dev-only-insecure-key-do-not-use-in-production';
  }
  return key;
})();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize CDP Client lazily (only if credentials provided)
let cdp: CdpClient | null = null;
let cdpDisabled = false;

function getCdpClient(): CdpClient {
  if (cdpDisabled) {
    throw new Error('CDP is disabled — no credentials configured. This is an open source demo. Add CDP credentials to enable wallet features.');
  }
  if (!cdp) {
    const apiKeyId = process.env.CDP_API_KEY_NAME;
    const privateKey = process.env.CDP_PRIVATE_KEY;
    const walletSecret = process.env.CDP_WALLET_SECRET;

    if (!apiKeyId || !privateKey || !walletSecret) {
      cdpDisabled = true;
      throw new Error('CDP is disabled — no credentials configured. This is an open source demo. Add CDP credentials to enable wallet features.');
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
    try {
      // 1. Create Server Account
      const client = getCdpClient();
      const account = await client.evm.createAccount({ name: `agent-${agentId}` });
      const address = account.address;
      
      // 2. Encrypt and store metadata
      const encryptedMetadata = this.encrypt(JSON.stringify({ address, name: account.name }));
      
      await pool.query(
        'INSERT INTO wallets (user_id, address, wallet_seed_encrypted, network, wallet_type) VALUES ($1, $2, $3, $4, $5)',
        [userId, address, encryptedMetadata, 'base', 'cdp']
      );

      return { address };
    } catch (error) {
      console.error('Account creation failed:', error);
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
    try {
      // 1. Build USDC transfer transaction (ERC20 transfer)
      // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
      const client = getCdpClient();
      const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Hex;
      const amountUnits = parseUnits(amount.toString(), 6);
      
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
      const usdcBalance = result.balances.find(b => b.token?.symbol?.toUpperCase() === 'USDC');
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
