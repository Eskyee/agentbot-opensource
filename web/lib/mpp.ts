import { Mppx, tempo } from 'mppx/client';
import { LocalAccount, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { tempoModerato } from 'viem/chains';

const mppxCache = new Map<string, Awaited<ReturnType<typeof Mppx.create>>>();

export interface MPPConfig {
  privateKey?: string;
}

export interface AgentMPPWallet {
  agentId: string;
  companyId: string;
  privateKey: string;
  address: string;
}

export function getMPPConfig(): MPPConfig {
  return {
    privateKey: process.env.MPP_PRIVATE_KEY,
  };
}

export async function createMPPClientForWallet(privateKey: string): Promise<{ mppx: Awaited<ReturnType<typeof Mppx.create>>, address: string }> {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const address = account.address;
  
  const cacheKey = address.toLowerCase();
  
  if (mppxCache.has(cacheKey)) {
    return { mppx: mppxCache.get(cacheKey)!, address };
  }
  
  const mppx = Mppx.create({
    methods: [tempo({ account })],
    polyfill: false,
  });
  
  mppxCache.set(cacheKey, mppx);
  return { mppx, address };
}

export async function createMPPClient(agentId?: string) {
  const config = getMPPConfig();
  
  if (!config.privateKey) {
    throw new Error('MPP_PRIVATE_KEY not configured');
  }
  
  if (agentId) {
    const agentWallets = getAgentMPPWallets();
    const wallet = agentWallets.find(w => w.agentId === agentId);
    
    if (wallet) {
      return createMPPClientForWallet(wallet.privateKey);
    }
  }
  
  return createMPPClientForWallet(config.privateKey);
}

export async function makeMPPRequest<T>(
  url: string,
  options: RequestInit & { agentId?: string } = {}
): Promise<T> {
  const { agentId, ...fetchOptions } = options;
  const { mppx } = await createMPPClient(agentId);
  
  const response = await mppx.fetch(url, fetchOptions);
  
  if (response.status === 402) {
    throw new Error('Payment required - 402 Payment Required');
  }
  
  if (!response.ok) {
    throw new Error(`MPP request failed: ${response.status}`);
  }
  
  return response.json();
}

export async function getMPPClient(agentId?: string) {
  return createMPPClient(agentId);
}

export function getAgentMPPWallets(): AgentMPPWallet[] {
  const walletsJson = process.env.MPP_AGENT_WALLETS;
  
  if (!walletsJson) {
    return [];
  }
  
  try {
    return JSON.parse(walletsJson);
  } catch {
    return [];
  }
}

export function registerAgentWallet(agentId: string, companyId: string, privateKey: string): AgentMPPWallet {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const wallet: AgentMPPWallet = {
    agentId,
    companyId,
    privateKey,
    address: account.address,
  };
  
  const wallets = getAgentMPPWallets();
  const existing = wallets.findIndex(w => w.agentId === agentId);
  
  if (existing >= 0) {
    wallets[existing] = wallet;
  } else {
    wallets.push(wallet);
  }
  
  const cacheKey = account.address.toLowerCase();
  mppxCache.delete(cacheKey);
  
  return wallet;
}

export function getAgentWalletAddress(agentId: string): string | null {
  const wallets = getAgentMPPWallets();
  const wallet = wallets.find(w => w.agentId === agentId);
  return wallet?.address || null;
}

function generatePrivateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function createAgentWallet(): { privateKey: string; address: string } {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return {
    privateKey,
    address: account.address,
  };
}

export async function createWalletForAgent(agentId: string, companyId: string): Promise<AgentMPPWallet> {
  const { privateKey, address } = createAgentWallet();
  
  const wallet: AgentMPPWallet = {
    agentId,
    companyId,
    privateKey,
    address,
  };
  
  const wallets = getAgentMPPWallets();
  wallets.push(wallet);
  
  const cacheKey = address.toLowerCase();
  mppxCache.delete(cacheKey);
  
  return wallet;
}

export async function setupTempoWalletClient(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  const client = createWalletClient({
    chain: tempoModerato,
    transport: http(),
    account,
  });
  
  return client;
}

export async function getAgentBalance(agentId: string): Promise<string> {
  const wallets = getAgentMPPWallets();
  const wallet = wallets.find(w => w.agentId === agentId);
  
  if (!wallet) {
    throw new Error(`No wallet found for agent ${agentId}`);
  }
  
  return '0';
}

export const mppConfig = getMPPConfig();
