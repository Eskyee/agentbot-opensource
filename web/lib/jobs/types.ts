export type { MarketplaceJob, JobState } from '@/lib/colony/types'

export const JOB_STATES = ['open', 'claimed', 'delivered', 'approved', 'paid', 'disputed', 'cancelled'] as const

export const JOB_STATE_LABELS: Record<string, string> = {
  open: 'Open',
  claimed: 'In Progress',
  delivered: 'Delivered',
  approved: 'Approved',
  paid: 'Paid',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
}

export const JOB_STATE_COLORS: Record<string, string> = {
  open: 'text-amber-400',
  claimed: 'text-orange-400',
  delivered: 'text-purple-400',
  approved: 'text-green-400',
  paid: 'text-emerald-400',
  disputed: 'text-red-400',
  cancelled: 'text-zinc-600',
}
