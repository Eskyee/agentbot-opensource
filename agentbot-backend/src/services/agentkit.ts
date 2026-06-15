/**
 * AgentKit Service — Coinbase AgentKit integration for Agentbot agents
 *
 * Each agent gets its own wallet via AgentKit's CDP wallet provider.
 * Provides: wallet creation, USDC transfers, token swaps, balance checks.
 */

import { AgentKit, CdpEvmWalletProvider, walletActionProvider, erc20ActionProvider } from '@coinbase/agentkit';
import { getVercelAITools } from '@coinbase/agentkit-vercel-ai-sdk';
import { log } from '../lib/logger';
import { pool } from '../lib/db';

// Lazy-initialized AgentKit + wallet provider
let agentKit: AgentKit | null = null;
let walletProvider: CdpEvmWalletProvider | null = null;

async function getAgentKit(): Promise<{ kit: AgentKit; wp: CdpEvmWalletProvider }> {
  if (agentKit && walletProvider) return { kit: agentKit, wp: walletProvider };

  const apiKeyId = process.env.CDP_API_KEY_NAME;
  const apiKeySecret = process.env.CDP_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const walletSecret = process.env.CDP_WALLET_SECRET;

  if (!apiKeyId || !apiKeySecret || !walletSecret) {
    throw new Error('CDP credentials not configured for AgentKit. Set CDP_API_KEY_NAME, CDP_PRIVATE_KEY, CDP_WALLET_SECRET.');
  }

  walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId,
    apiKeySecret,
    networkId: 'base-mainnet',
    walletSecret,
  });

  agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      walletActionProvider(),
      erc20ActionProvider(),
    ],
  });

  log.info('[AgentKit] Initialized with CDP EVM wallet provider on Base Mainnet');
  return { kit: agentKit, wp: walletProvider };
}

export interface AgentWalletInfo {
  address: string;
  network: string;
  walletId: string | null;
}

export interface WalletBalance {
  asset: string;
  balance: string;
  address: string;
}

export class AgentKitService {
  /**
   * Create or retrieve an AgentKit wallet for a specific agent.
   * Stores wallet metadata in the existing wallets table.
   */
  static async getOrCreateAgentWallet(
    userId: string,
    agentId: string
  ): Promise<AgentWalletInfo> {
    // Check if agent already has a wallet
    const existing = await pool.query(
      `SELECT id, address, metadata FROM wallets WHERE user_id = $1 AND agent_id = $2 LIMIT 1`,
      [userId, agentId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        address: row.address,
        network: 'base-mainnet',
        walletId: row.id,
      };
    }

    // Create new wallet via AgentKit
    const { wp } = await getAgentKit();
    const address = wp.getAddress();

    // Store in DB
    const result = await pool.query(
      `INSERT INTO wallets (id, user_id, agent_id, address, network, metadata, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'base-mainnet', $4, NOW())
       RETURNING id`,
      [
        userId,
        agentId,
        address,
        JSON.stringify({
          source: 'agentkit',
          chainId: 8453,
          createdAt: new Date().toISOString(),
        }),
      ]
    );

    log.info(`[AgentKit] Created wallet ${address} for agent ${agentId}`);

    return {
      address,
      network: 'base-mainnet',
      walletId: result.rows[0].id,
    };
  }

  /**
   * Get balances for an agent's wallet.
   */
  static async getBalances(agentId: string): Promise<WalletBalance[]> {
    const { wp } = await getAgentKit();
    const address = wp.getAddress();

    // Get native ETH balance via public client
    const ethBalance = await wp.getPublicClient().getBalance({ address: address as `0x${string}` });

    const balances: WalletBalance[] = [
      {
        asset: 'ETH',
        balance: (Number(ethBalance) / 1e18).toFixed(6),
        address,
      },
    ];

    return balances;
  }

  /**
   * Send USDC from an agent's wallet to another address.
   */
  static async sendUSDC(
    agentId: string,
    toAddress: string,
    amount: string
  ): Promise<{ txHash: string; amount: string; to: string }> {
    const { wp } = await getAgentKit();

    // Use AgentKit's wallet to send USDC
    const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
    const decimals = 6;
    const rawAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

    // Encode ERC-20 transfer
    const data = `0xa9059cbb${toAddress.slice(2).padStart(64, '0')}${rawAmount.toString(16).padStart(64, '0')}`;

    const txHash = await wp.sendTransaction({
      to: usdcAddress as `0x${string}`,
      data: data as `0x${string}`,
      value: 0n,
    });

    log.info(`[AgentKit] Agent ${agentId} sent ${amount} USDC to ${toAddress}: ${txHash}`);

    return { txHash, amount, to: toAddress };
  }

  /**
   * Get Vercel AI SDK tools for an agent — use with generateText()/streamText().
   */
  static async getAgentTools() {
    const { kit } = await getAgentKit();
    return getVercelAITools(kit);
  }

  /**
   * Execute an AgentKit action by name (for agent tool calling).
   */
  static async executeAction(
    actionName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const { kit } = await getAgentKit();

    const action = kit.getActions().find((a) => a.name === actionName);

    if (!action) {
      throw new Error(`Unknown AgentKit action: ${actionName}`);
    }

    return action.invoke(args);
  }

  /**
   * List available AgentKit actions (for agent discovery).
   */
  static listActions(): Array<{ name: string; description: string; inputSchema: unknown }> {
    return [
      {
        name: 'wallet_action',
        description: 'Native wallet operations (send ETH, etc)',
        inputSchema: {},
      },
      {
        name: 'erc20_action',
        description: 'ERC-20 token operations (transfer, balance)',
        inputSchema: {},
      },
    ];
  }
}
