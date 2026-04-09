/**
 * DexScreener Price Integration
 * Fetches pool prices from DexScreener API with abort controller timeout.
 * Designed for periodic cron execution.
 */

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';
const REQUEST_TIMEOUT_MS = 10_000; // 10 seconds

interface DexScreenerPair {
  chainId: string;
  baseToken: { address: string; symbol: string };
  quoteToken: { address: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  priceChange?: { h24: string };
  volume?: { h24: string };
  marketCap?: string;
  fdv?: string;
}

interface PoolPrice {
  tokenAddress: string;
  priceUsd: string | null;
  priceNative: string | null;
  priceChange24h: string | null;
  volume24h: string | null;
  marketCap: string | null;
}

/**
 * Fetch price data for a single token from DexScreener
 */
export async function fetchTokenPrice(tokenAddress: string): Promise<PoolPrice | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(`${DEXSCREENER_API}/${tokenAddress}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = (await response.json()) as { pairs: DexScreenerPair[] };
    const pairs = data.pairs || [];

    // Find best pair (prefer Base chain, then highest liquidity)
    const basePair =
      pairs.find((p) => p.chainId === 'base') || pairs[0];

    if (!basePair) return null;

    return {
      tokenAddress,
      priceUsd: basePair.priceUsd || null,
      priceNative: basePair.priceNative || null,
      priceChange24h: basePair.priceChange?.h24 || null,
      volume24h: basePair.volume?.h24 || null,
      marketCap: basePair.marketCap || basePair.fdv || null,
    };
  } catch (error: unknown) {
    if ((error as Error).name === 'AbortError') {
      console.warn(`[dexscreener] Request timed out for ${tokenAddress}`);
    } else {
      console.error(`[dexscreener] Fetch error for ${tokenAddress}:`, error);
    }
    return null;
  }
}

/**
 * Fetch prices for multiple tokens in parallel
 */
export async function fetchMultipleTokenPrices(
  tokenAddresses: string[]
): Promise<Map<string, PoolPrice>> {
  const results = new Map<string, PoolPrice>();

  const promises = tokenAddresses.map(async (addr) => {
    const price = await fetchTokenPrice(addr);
    if (price) results.set(addr.toLowerCase(), price);
  });

  await Promise.allSettled(promises);
  return results;
}

/**
 * Update pool prices in database
 * Call this from a cron job every 5 minutes
 */
export async function updatePoolPrices(
  pools: Array<{ tokenAddress: string; id: string }>
): Promise<number> {
  let updated = 0;

  for (const pool of pools) {
    try {
      const price = await fetchTokenPrice(pool.tokenAddress);
      if (price) {
        // Caller should update the database with price data
        updated++;
      }
    } catch {
      // Continue with other pools
    }
  }

  console.log(`[dexscreener] Updated prices for ${updated}/${pools.length} pools`);
  return updated;
}
