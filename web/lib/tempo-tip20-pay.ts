/**
 * tempo-tip20 x402 payer — signs an ERC-3009-style transferWithAuthorization
 * authorization and POSTs it to a paid endpoint via the X-PAYMENT header.
 *
 * Spec assumptions (from compusophy/tempo-x402 README "EIP-712 signing, TIP-20 contracts"):
 * - TIP-20 implements EIP-3009 transferWithAuthorization
 * - Domain: name=pathUSD, version=1, chainId from network, verifyingContract=asset
 * - X-PAYMENT payload is base64(JSON({ x402Version, scheme, network, payload }))
 *
 * If the queen rejects the signature, the error surface will tell us which of
 * those assumptions to fix — funds don't move until the queen relays to chain.
 */

import { createWalletClient, http, parseAbi, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export interface X402Accept {
  scheme: string;
  network: string;
  price: string;
  asset: Address;
  amount: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  description: string;
  mimeType?: string;
}

export interface X402Challenge {
  x402Version: number;
  accepts: X402Accept[];
}

export interface PayResult {
  ok: boolean;
  status: number;
  receipt?: string;
  txHash?: string;
  body?: unknown;
  error?: string;
  challenge?: X402Accept;
}

const TEMPO_RPC = 'https://rpc.tempo.build';

function randomNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) as Hex;
}

function chainIdFromNetwork(network: string): number {
  // eip155:42431 → 42431
  const m = /^eip155:(\d+)$/.exec(network);
  if (!m) throw new Error(`Unsupported network: ${network}`);
  return Number(m[1]);
}

/**
 * Sign + submit an x402 tempo-tip20 payment to a paid endpoint.
 *
 * @param url The paid endpoint URL (e.g. https://borg-0-production.up.railway.app/clone)
 * @param privateKey Server-side wallet with pathUSD balance
 * @param requestBody Body to send with the paid request
 */
export async function payX402TempoTip20(
  url: string,
  privateKey: Hex,
  requestBody: Record<string, unknown> = {},
): Promise<PayResult> {
  // 1. Probe the endpoint to get the 402 challenge.
  const challengeRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (challengeRes.status !== 402) {
    const body = await challengeRes.json().catch(() => ({}));
    return { ok: challengeRes.ok, status: challengeRes.status, body };
  }

  const challenge: X402Challenge = await challengeRes.json();
  const accept = challenge.accepts.find(a => a.scheme === 'tempo-tip20');
  if (!accept) {
    return { ok: false, status: 402, error: 'No tempo-tip20 acceptor in 402 challenge' };
  }

  // 2. Build the EIP-3009 authorization.
  const account = privateKeyToAccount(privateKey);
  const chainId = chainIdFromNetwork(accept.network);
  const nowSec = Math.floor(Date.now() / 1000);
  const validAfter = BigInt(nowSec - 60);
  const validBefore = BigInt(nowSec + accept.maxTimeoutSeconds + 60);
  const nonce = randomNonce();

  const authorization = {
    from: account.address,
    to: accept.payTo,
    value: BigInt(accept.amount),
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await account.signTypedData({
    domain: {
      name: 'pathUSD',
      version: '1',
      chainId,
      verifyingContract: accept.asset,
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: authorization,
  });

  // 3. Build the X-PAYMENT header (base64 JSON).
  const payload = {
    x402Version: challenge.x402Version,
    scheme: accept.scheme,
    network: accept.network,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: accept.amount,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };
  const xPayment = Buffer.from(JSON.stringify(payload)).toString('base64');

  // 4. Retry the request with the payment header.
  const paidRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT': xPayment,
    },
    body: JSON.stringify(requestBody),
  });

  const body = await paidRes.json().catch(() => null);
  const receipt = paidRes.headers.get('X-Payment-Response') ?? paidRes.headers.get('Payment-Response') ?? undefined;

  return {
    ok: paidRes.ok,
    status: paidRes.status,
    body,
    receipt,
    challenge: accept,
    error: paidRes.ok ? undefined : (body && typeof body === 'object' && 'error' in body ? String((body as any).error) : `HTTP ${paidRes.status}`),
  };
}

/**
 * Read pathUSD balance for a wallet on Tempo.
 */
export async function getPathUSDBalance(address: Address, asset: Address): Promise<bigint> {
  const ERC20 = parseAbi(['function balanceOf(address) view returns (uint256)']);
  const { createPublicClient } = await import('viem');
  const client = createPublicClient({
    chain: { id: 42431, name: 'Tempo', nativeCurrency: { name: 'pathUSD', symbol: 'pathUSD', decimals: 6 }, rpcUrls: { default: { http: [TEMPO_RPC] } } } as any,
    transport: http(TEMPO_RPC),
  });
  return await client.readContract({ address: asset, abi: ERC20, functionName: 'balanceOf', args: [address] });
}

// ── Suppress unused createWalletClient ─────────────────────────────────────
// (kept in import for potential direct on-chain submit fallback)
void createWalletClient;
