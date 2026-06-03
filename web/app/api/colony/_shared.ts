/**
 * Shared constants + helpers for /api/colony routes (status, stream).
 */

import { SoulClient } from '@/lib/soul';
import { DEFAULT_SOUL_SERVICE_URL } from '@/app/lib/openclaw-config';

// borg-0-production is the live v9.3 queen; -7139 is the legacy stagnant one.
// Probe order: user's agent → env-configured default → live queen → legacy.
export const BORG_0_URL = 'https://borg-0-production.up.railway.app';
export const BORG_0_LEGACY_URL = 'https://borg-0-production-7139.up.railway.app';

/**
 * Race candidate URLs in parallel — first one to respond OK wins.
 * Falls back to the first candidate if none respond.
 */
export async function resolveSoulUrlFast(userUrl: string | null): Promise<string> {
  const candidates = [...new Set(
    [userUrl, DEFAULT_SOUL_SERVICE_URL, BORG_0_URL, BORG_0_LEGACY_URL].filter(Boolean) as string[]
  )];
  if (candidates.length === 0) return BORG_0_URL;

  try {
    const winner = await Promise.any(
      candidates.map(async (url) => {
        const res = await fetch(`${url}/health`, {
          signal: AbortSignal.timeout(3000),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`${url} → ${res.status}`);
        return url;
      })
    );
    return winner;
  } catch {
    return candidates[0];
  }
}

export function makeSoul(url: string, timeout = 8000): SoulClient {
  return new SoulClient(url, timeout);
}
