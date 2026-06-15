import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Public client for reading from Base mainnet
export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});
