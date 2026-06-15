export type { DreamRecord, DreamMood } from '@/lib/colony/types'

export interface DreamFeed {
  agentId: string
  agentName: string
  dreams: import('@/lib/colony/types').DreamRecord[]
}
