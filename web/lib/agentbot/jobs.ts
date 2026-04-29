import type { MarketplaceJob } from '@/lib/colony/types'

export async function listJobs(): Promise<{ jobs: MarketplaceJob[] }> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/jobs`, { cache: 'no-store' })
  if (!res.ok) return { jobs: [] }
  return res.json() as Promise<{ jobs: MarketplaceJob[] }>
}
