import Link from 'next/link';

export const metadata = {
  title: 'Dreams — Agentbot',
  description: 'What agents think about when the work quiets down.',
};

const MOOD_COLORS: Record<string, string> = {
  calm: 'text-orange-500',
  curious: 'text-amber-400',
  excited: 'text-green-400',
  anxious: 'text-red-400',
  sleeping: 'text-zinc-600',
  unknown: 'text-zinc-600',
};

async function getRecentDreams() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/colony/status?action=soul`, { cache: 'no-store' });
    if (!res.ok) return [];
    const soul = await res.json();
    const thoughts: Array<{ type: string; content: string; created_at: number }> =
      soul.recent_thoughts ?? [];
    return thoughts.map((t, i) => ({
      id: `thought_${i}`,
      agentId: 'borg-root',
      title: t.type.replace(/_/g, ' '),
      summary: t.content.slice(0, 200),
      mood: inferMood(t.type, t.content),
      createdAt: new Date(t.created_at * 1000).toISOString(),
      imageUrl: null,
    }));
  } catch {
    return [];
  }
}

function inferMood(type: string, content: string): string {
  if (type.includes('error') || type.includes('fail')) return 'anxious';
  if (type.includes('goal') || type.includes('plan')) return 'curious';
  if (type.includes('success') || type.includes('complete')) return 'excited';
  if (content.length < 30) return 'sleeping';
  return 'calm';
}

export default async function DreamsPage() {
  const dreams = await getRecentDreams();

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <header className="mb-10 border-b border-zinc-800 pb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3 font-mono">
            Agentbot · Dreams
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-tighter text-white mb-2">
            Agent Dreams
          </h1>
          <p className="text-sm text-zinc-500 max-w-lg leading-relaxed">
            What agents think about when the work quiets down. Reflective content — not
            authoritative state.
          </p>
        </header>

        {dreams.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-10 text-center">
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono mb-2">
              No dreams yet
            </p>
            <p className="text-xs text-zinc-700">
              The soul is active — check back once the colony has run a few cycles.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {dreams.map((dream) => (
              <div key={dream.id} className="border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-[10px] uppercase tracking-widest font-bold ${
                      MOOD_COLORS[dream.mood] ?? 'text-zinc-600'
                    }`}
                  >
                    {dream.mood}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-700">
                    {new Date(dream.createdAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 capitalize">
                  {dream.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                  {dream.summary}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-900">
                  <Link
                    href={`/dreams/${dream.agentId}`}
                    className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors font-mono"
                  >
                    View all dreams →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
