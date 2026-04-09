import type { Metadata } from 'next'
import Link from 'next/link'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Agent Showcase — Agentbot',
  description: 'Meet the AI agents built on Agentbot. Music, culture, and creative industry agents running on OpenClaw.',
  openGraph: {
    title: 'Agent Showcase — Agentbot',
    description: 'AI agents for music, culture, and the creative industry. Built on OpenClaw, managed by Agentbot.',
    url: buildAppUrl('/showcase'),
  },
}

const PERSONALITY_LABELS: Record<string, { label: string; color: string }> = {
  basement: { label: 'Underground', color: 'text-blue-400 border-blue-900' },
  selector: { label: 'Selector', color: 'text-green-400 border-green-900' },
  ar:       { label: 'A&R', color: 'text-purple-400 border-purple-900' },
  road:     { label: 'Road', color: 'text-yellow-400 border-yellow-900' },
  label:    { label: 'Label Ops', color: 'text-orange-400 border-orange-900' },
}

interface ShowcaseAgent {
  id: string
  name: string
  description: string | null
  personalityType: string
  expertise: string
  memberSince: string
}

async function getAgents(): Promise<{ agents: ShowcaseAgent[]; failed: boolean }> {
  try {
    const res = await fetch(
      buildAppUrl('/api/showcase'),
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return { agents: [], failed: true }
    const data = await res.json()
    return { agents: data.agents ?? [], failed: false }
  } catch {
    return { agents: [], failed: true }
  }
}

export default async function ShowcasePage() {
  const { agents, failed } = await getAgents()

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <div className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
          ← Agentbot
        </Link>
        <Link
          href="/register"
          className="text-xs bg-white text-black px-4 py-2 uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
        >
          Deploy your agent
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Live agents</p>
          <h1 className="text-5xl font-bold uppercase tracking-tighter mb-6">
            Agent Showcase
          </h1>
          <p className="text-zinc-400 max-w-xl text-sm leading-relaxed">
            AI agents built by the music and culture community. Each one runs on OpenClaw —
            autonomous, always-on, and wired into the scene. Our community learning labs span
            London and the USA, giving OpenClaw operators a shared space to build together.
          </p>
        </div>

        {failed ? (
          <div className="border border-zinc-800 p-16 text-center">
            <p className="text-zinc-600 text-sm uppercase tracking-widest mb-2">Showcase unavailable</p>
            <p className="text-zinc-500 text-xs mb-8">
              The public showcase is temporarily having trouble loading. Please try again shortly.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/"
                className="text-xs border border-zinc-700 text-zinc-400 px-6 py-3 uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
              >
                Back home
              </Link>
              <Link
                href="/register"
                className="text-xs bg-white text-black px-6 py-3 uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
              >
                Deploy your agent
              </Link>
            </div>
          </div>
        ) : agents.length === 0 ? (
          /* Empty state */
          <div className="border border-zinc-800 p-16 text-center">
            <p className="text-zinc-600 text-sm uppercase tracking-widest mb-2">No agents yet</p>
            <p className="text-zinc-500 text-xs mb-8">Be the first to add your agent to the showcase.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="text-xs bg-white text-black px-6 py-3 uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
              >
                Deploy your agent
              </Link>
              <Link
                href="/settings?tab=agents#showcase"
                className="text-xs border border-zinc-700 text-zinc-400 px-6 py-3 uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
              >
                Add to showcase
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-8">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} online
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
              {agents.map((agent) => {
                const personality = PERSONALITY_LABELS[agent.personalityType] ?? PERSONALITY_LABELS.basement
                const year = new Date(agent.memberSince).getFullYear()

                return (
                  <div
                    key={agent.id}
                    className="bg-black p-6 flex flex-col gap-4 hover:bg-zinc-950 transition-colors"
                  >
                    {/* Name + type */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                          <h2 className="text-sm font-bold uppercase tracking-tight truncate">
                            {agent.name}
                          </h2>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 ${personality.color}`}>
                          {personality.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-700 shrink-0">{year}</span>
                    </div>

                    {/* Description or expertise */}
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                      {agent.description || agent.expertise || 'Music & culture AI agent running on OpenClaw.'}
                    </p>

                    {/* Expertise tags */}
                    {agent.expertise && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {agent.expertise.split(',').slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-0.5"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="mt-24 border border-zinc-800 p-12 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-4">
            Add your agent to the showcase
          </h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">
            Toggle showcase opt-in in your dashboard settings. Your agent joins the directory and becomes discoverable.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="text-xs bg-white text-black px-6 py-3 uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
            >
              Deploy an agent — free trial
            </Link>
            <Link
              href="/settings?tab=agents#showcase"
              className="text-xs border border-zinc-700 text-zinc-400 px-6 py-3 uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
            >
              Add to showcase
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
