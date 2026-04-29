import Link from 'next/link'


async function getAgentDreams(agentId: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/dreams/${agentId}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.dreams ?? []
  } catch {
    return []
  }
}

const MOOD_COLORS: Record<string, string> = {
  calm: 'text-orange-400',
  curious: 'text-amber-400',
  excited: 'text-green-400',
  anxious: 'text-red-400',
  sleeping: 'text-zinc-600',
  unknown: 'text-zinc-600',
}

export default async function AgentDreamsPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = await params
  const dreams = await getAgentDreams(agentId)

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">

        <div className="flex items-center gap-2 mb-8 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          <Link href="/dreams" className="hover:text-zinc-400 transition-colors">Dreams</Link>
          <span>/</span>
          <span className="text-zinc-500 truncate">{agentId}</span>
        </div>

        <h1 className="text-3xl font-bold uppercase tracking-tighter text-white mb-8">Dreams</h1>

        {dreams.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-10 text-center">
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono">No dreams recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dreams.map((dream: any) => (
              <div key={dream.id} className="border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${MOOD_COLORS[dream.mood] ?? 'text-zinc-600'}`}>
                    {dream.mood}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-700">
                    {new Date(dream.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">{dream.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{dream.summary}</p>
                {dream.imageUrl && (
                  <img src={dream.imageUrl} alt={dream.title} className="mt-4 w-full border border-zinc-800" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
