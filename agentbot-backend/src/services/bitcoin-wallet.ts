import CryptoJS from 'crypto-js';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type BitcoinWalletRow = {
  id: number;
  user_id: string;
  agent_id: string;
  label: string | null;
  derivation_scheme_encrypted: string;
  network: string;
  created_at: string;
};

type ExplorerBalance = {
  confirmed?: string;
  unconfirmed?: string;
  available?: string;
  immature?: string;
  total?: string;
};

export class BitcoinWalletService {
  private static getEncryptionKey(): string {
    const key = process.env.WALLET_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('WALLET_ENCRYPTION_KEY environment variable must be set');
    }
    return key;
  }

  private static encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.getEncryptionKey()).toString();
  }

  private static decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.getEncryptionKey());
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private static getExplorerBaseUrl(): string {
    return (process.env.BTC_BACKEND_NBXPLORER_URL || 'http://localhost:32838').replace(/\/+$/, '');
  }

  private static getExplorerHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authorization = process.env.BTC_BACKEND_NBXPLORER_AUTH;
    if (authorization) {
      headers.Authorization = authorization;
    }

    return headers;
  }

  private static async requestExplorer<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(`${this.getExplorerBaseUrl()}${path}`, {
        ...init,
        headers: {
          ...this.getExplorerHeaders(),
          ...(init?.headers || {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`NBXplorer request failed (${response.status}): ${body || response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  static async getBackendInfo(): Promise<Record<string, unknown>> {
    return this.requestExplorer<Record<string, unknown>>('/v1/cryptos/btc/status');
  }

  static async registerWatchOnlyWallet(
    userId: string,
    agentId: string,
    derivationScheme: string,
    label?: string
  ): Promise<{ id: number; agentId: string; label: string | null; network: string }> {
    const trimmed = derivationScheme.trim();
    if (!trimmed) {
      throw new Error('derivationScheme is required');
    }

    // Make the backend validate and start tracking the scheme before persisting locally.
    await this.requestExplorer('/v1/cryptos/btc/derivations', {
      method: 'POST',
      body: JSON.stringify({ derivationScheme: trimmed }),
    });

    const encryptedScheme = this.encrypt(trimmed);
    const result = await pool.query(
      `INSERT INTO bitcoin_wallets (user_id, agent_id, label, derivation_scheme_encrypted, network)
       VALUES ($1, $2, $3, $4, 'btc')
       RETURNING id, agent_id, label, network`,
      [userId, agentId, label || null, encryptedScheme]
    );

    return {
      id: result.rows[0].id,
      agentId: result.rows[0].agent_id,
      label: result.rows[0].label,
      network: result.rows[0].network,
    };
  }

  static async listWallets(userId: string): Promise<Array<{ id: number; agentId: string; label: string | null; network: string; createdAt: string }>> {
    const result = await pool.query(
      `SELECT id, agent_id, label, network, created_at
       FROM bitcoin_wallets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
      label: row.label,
      network: row.network,
      createdAt: row.created_at,
    }));
  }

  private static async getWallet(userId: string, walletId: number): Promise<BitcoinWalletRow> {
    const result = await pool.query(
      `SELECT id, user_id, agent_id, label, derivation_scheme_encrypted, network, created_at
       FROM bitcoin_wallets
       WHERE id = $1 AND user_id = $2`,
      [walletId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Bitcoin wallet not found');
    }

    return result.rows[0] as BitcoinWalletRow;
  }

  static async getUnusedAddress(userId: string, walletId: number): Promise<Record<string, unknown>> {
    const wallet = await this.getWallet(userId, walletId);
    const derivationScheme = this.decrypt(wallet.derivation_scheme_encrypted);
    return this.requestExplorer<Record<string, unknown>>(
      `/v1/cryptos/btc/derivations/${encodeURIComponent(derivationScheme)}/addresses/unused`
    );
  }

  static async getBalance(userId: string, walletId: number): Promise<ExplorerBalance> {
    const wallet = await this.getWallet(userId, walletId);
    const derivationScheme = this.decrypt(wallet.derivation_scheme_encrypted);
    return this.requestExplorer<ExplorerBalance>(
      `/v1/cryptos/btc/derivations/${encodeURIComponent(derivationScheme)}/balance`
    );
  }

  static async getTransactions(userId: string, walletId: number): Promise<Record<string, unknown>> {
    const wallet = await this.getWallet(userId, walletId);
    const derivationScheme = this.decrypt(wallet.derivation_scheme_encrypted);
    return this.requestExplorer<Record<string, unknown>>(
      `/v1/cryptos/btc/derivations/${encodeURIComponent(derivationScheme)}/transactions`
    );
  }
}
