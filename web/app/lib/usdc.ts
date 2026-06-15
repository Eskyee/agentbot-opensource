/**
 * USDC contract addresses + CAIP-2 network ids, shared by the A2A payment gate
 * and the escrow flow so both verify against exactly the same asset/network.
 * Smallest unit; USDC has 6 decimals (1 USDC = 1_000_000).
 */
export const USDC_BY_NETWORK: Record<string, { asset: string; caip2: string }> = {
  base: { asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', caip2: 'eip155:8453' },
  'base-sepolia': { asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', caip2: 'eip155:84532' },
}

/** Resolve a wallet network name to its USDC config, defaulting to Base mainnet. */
export function usdcFor(network: string | null | undefined) {
  return USDC_BY_NETWORK[network ?? 'base'] ?? USDC_BY_NETWORK.base
}
