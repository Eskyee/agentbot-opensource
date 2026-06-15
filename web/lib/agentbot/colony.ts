import type { ColonyOverview } from '@/lib/colony/types'
import { normalizeTreeToOverview } from '@/lib/colony/normalize'
import type { StarterColonyInput } from '@/lib/colony/types'

/**
 * Get colony overview by fetching the real soul/colony status endpoint
 * and normalizing it into ColonyOverview shape.
 * The colonyId 'friday-alpha' maps to the default live colony.
 */
export async function getColonyOverview(colonyId: string): Promise<ColonyOverview> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/colony/status?action=tree`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Colony status fetch failed: ${res.status}`)
  const tree = await res.json()
  return normalizeTreeToOverview(tree, colonyId)
}

export async function createStarterColony(input: StarterColonyInput): Promise<{ colonyId: string }> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/colony/starter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Starter colony create failed: ${res.status}`)
  return res.json() as Promise<{ colonyId: string }>
}
