import Link from 'next/link';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export const metadata = {
  title: 'Colony Dashboard — Agentbot',
};

async function getColonyTree() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const res = await fetch(`${base}/api/colony/status?action=tree`, {
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const MOOD_COLORS: Record<string, string> = {
  excited: 'text-amber-400',
  curious: 'text-red-500',
  calm: 'text-green-400',
  anxious: 'text-red-400',
  sleeping: 'text-zinc-600',
  unknown: 'text-zinc-600',
};

function fitnessToMood(fitness: number): string {
  if (fitness >= 80) return 'excited';
  if (fitness >= 60) return 'curious';
  if (fitness >= 40) return 'calm';
  if (fitness >= 20) return 'anxious';
  return 'sleeping';
}

function fitnessBar(fitness: number) {
  const pct = Math.min(100, Math.max(0, fitness));
  const color = fitness >= 70 ? 'bg-green-500' : fitness >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return { pct, color };
}

export default async function ColonyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const tree = await getColonyTree();

  if (!tree && id !== 'friday-alpha') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-600 text-xs uppercase tracking-widest font-mono mb-3">
            Colony not found
          </p>
          <Link
            href="/colony"
            className="text-zinc-400 hover:text-white text-xs uppercase tracking-widest transition-colors"
          >
            ← Back to colonies
          </Link>
        </div>
      </div>
    );
  }

  const agents = tree?.agents ?? [];
  const root = tree?.root ?? null;
  const degraded = tree?.degraded ?? true;
  const activePlan = root?.soul?.active_plan ?? null;

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
          <Link href="/colony" className="hover:text-zinc-400 transition-colors">
            Colony
          </Link>
          <span>/</span>
          <span className="text-zinc-500">{root?.designation ?? id}</span>
        </div>

        {/* Colony header */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 mb-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    degraded ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
                <h1 className="text-2xl font-bold uppercase tracking-tighter text-white">
                  {root?.designation ?? 'Agentbot Colony'}
                </h1>
              </div>
              <p className="text-xs text-zinc-600 font-mono mt-1">
                {tree?.colony_size ?? 0} nodes · avg fitness {tree?.avg_fitness ?? 0}% ·{' '}
                {degraded ? 'degraded' : 'healthy'}
              </p>
              {root?.soul?.mode && (
                <p className="text-[10px] uppercase tracking-widest text-zinc-700 mt-2 font-mono">
                  Soul mode: {root.soul.mode} · {root.soul.total_cycles ?? 0} cycles
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 text-right shrink-0">
              {root?.wallet_balance && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
                    Wallet
                  </p>
                  <p className="text-sm font-mono text-amber-400">
                    {root.wallet_balance.formatted} {root.wallet_balance.token}
                  </p>
                </div>
              )}
              {root?.colony && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
                    Rank
                  </p>
                  <p className="text-sm font-mono text-white">
                    #{root.colony.rank} of {root.colony.colony_size}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active plan strip */}
          {activePlan && (
            <div className="mt-5 border-t border-zinc-900 pt-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-1">
                Active plan
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{
                      width: `${
                        (activePlan.current_step / Math.max(activePlan.total_steps, 1)) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                  {activePlan.current_step}/{activePlan.total_steps} · {activePlan.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Agent nodes */}
        {agents.length > 0 ? (
          <section className="mb-6">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 font-mono">
              Agents · {agents.length}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent: any) => {
                const mood = fitnessToMood(agent.fitness ?? 0);
                const bar = fitnessBar(agent.fitness ?? 0);
                return (
                  <div key={agent.id} className="border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                          {agent.name}
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-600 mt-0.5">
                          {agent.specialization ?? 'general'} · gen {agent.generation ?? 1}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-widest font-bold ${
                          MOOD_COLORS[mood] ?? 'text-zinc-600'
                        }`}
                      >
                        {mood}
                      </span>
                    </div>

                    {/* Fitness bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                          Fitness
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {agent.fitness ?? 0}%
                        </span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bar.color} transition-all`}
                          style={{ width: `${bar.pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      {agent.walletAddress &&
                        agent.walletAddress !== '0x0000000000000000000000000000000000000000' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                              Wallet
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 truncate">
                              {agent.walletAddress.slice(0, 6)}…{agent.walletAddress.slice(-4)}
                            </span>
                          </div>
                        )}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                          Status
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            agent.status === 'active'
                              ? 'text-green-400'
                              : agent.status === 'culling'
                                ? 'text-red-400'
                                : 'text-amber-400'
                          }`}
                        >
                          {agent.status}
                        </span>
                      </div>
                      {agent.children > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                            Spawned
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {agent.children} nodes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="border border-zinc-800 bg-zinc-950 p-8 text-center mb-6">
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono">
              {degraded ? 'Colony unreachable — soul service offline' : 'No agents active'}
            </p>
          </div>
        )}

        {/* Bottom row: soul state + actions */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Soul state */}
          {root?.soul && (
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 font-mono">
                Soul state
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Active', value: root.soul.active ? 'Yes' : 'No' },
                  { label: 'Dormant', value: root.soul.dormant ? 'Yes' : 'No' },
                  { label: 'Mode', value: root.soul.mode },
                  { label: 'Cycles', value: String(root.soul.total_cycles ?? 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
                      {label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4 font-mono">
              Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/colony/new"
                className="block text-center border border-zinc-700 text-zinc-300 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
              >
                Deploy your own colony
              </Link>
              <Link
                href="/dreams"
                className="block text-center border border-zinc-800 text-zinc-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
              >
                View agent dreams
              </Link>
              <Link
                href="/colony/jobs"
                className="block text-center border border-zinc-800 text-zinc-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
              >
                M2M job board
              </Link>
              {root?.dashboardUrl && (
                <a
                  href={root.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center border border-zinc-800 text-zinc-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Open Borg dashboard ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Babies / Buddies panel */}
        <div className="mt-4 border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
              Babies
            </h3>
            <Link
              href="/buddies"
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors font-mono"
            >
              View all →
            </Link>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Agent companions hatch and grow alongside your colony. Each baby bonds with an agent —
            feeding off its activity, earning XP, and evolving through stages.
          </p>
          <Link
            href="/buddies"
            className="mt-4 block text-center border border-zinc-800 text-zinc-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
          >
            Open Babies ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
