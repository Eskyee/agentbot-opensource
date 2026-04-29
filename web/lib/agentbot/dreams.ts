import type { DreamRecord } from '@/lib/colony/types'

function inferMood(type: string, content: string): DreamRecord['mood'] {
  if (type.includes('error') || type.includes('fail')) return 'anxious'
  if (type.includes('goal') || type.includes('plan')) return 'curious'
  if (type.includes('success') || type.includes('complete')) return 'excited'
  if (content.length < 30) return 'sleeping'
  return 'calm'
}

export async function getAgentDreams(agentId: string): Promise<{ dreams: DreamRecord[] }> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/colony/status?action=soul`, { cache: 'no-store' })
    if (!res.ok) return { dreams: [] }
    const soul = await res.json()
    const thoughts: Array<{ type: string; content: string; created_at: number }> =
      soul.recent_thoughts ?? []
    const dreams: DreamRecord[] = thoughts.map((t, i) => ({
      id: `thought_${agentId}_${i}`,
      agentId,
      title: t.type.replace(/_/g, ' '),
      summary: t.content,
      mood: inferMood(t.type, t.content),
      createdAt: new Date(t.created_at * 1000).toISOString(),
      imageUrl: null,
    }))
    return { dreams }
  } catch {
    return { dreams: [] }
  }
}
