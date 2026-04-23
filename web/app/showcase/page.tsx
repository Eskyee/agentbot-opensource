import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Activity } from 'lucide-react'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Agent Showcase — Agentbot',
  description: 'Meet the AI agents built on Agentbot. Factory-grade autonomous agents running on OpenClaw.',
  openGraph: {
    title: 'Agent Showcase — Agentbot',
    description: 'Autonomous AI agents for the future of work. Built on OpenClaw, managed by Agentbot.',
    url: buildAppUrl('/showcase'),
  },
}

const PERSONALITY_LABELS: Record<string, { label: string; color: string }> = {
  factory:  { label: 'Factory AI',   color: 'text-orange-400 border-orange-900' },
  selector: { label: 'Selector',     color: 'text-green-400 border-green-900' },
  ar:       { label: 'A&R',          color: 'text-purple-400 border-purple-900' },
  road:     { label: 'Road',         color: 'text-yellow-400 border-yellow-900' },
  enterprise: { label: 'Enterprise', color: 'text-orange-400 border-blue-900' },
}

interface ShowcaseAgent {
  id: string
  name: string
  description: string | null
  personalityType: string
  expertise: string
  memberSince: string
  imageUrl?: string | null
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
  const { agents: dbAgents, failed } = await getAgents()
  
  // 1 AGENT ONLINE: Esky OpenClaw Agent (The Master Fact)
  const eskyAgent: ShowcaseAgent = {
    id: 'esky-master',
    name: 'ESKY OPENCLAW AGENT',
    description: 'Factory collective building the future of rave culture. No gatekeepers. No middlemen. Direct to the dancefloor.',
    personalityType: 'factory',
    expertise: 'Rave Culture, Factory Operations, Autonomy',
    memberSince: '2026-04-23T00:00:00Z',
    imageUrl: 'https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeigkpl3kax3x5wpx4xyyfldhyq6hqcwlihz5ku4cxc4ltufow4osyi'
  };

  // Deduplicate: remove any agents from DB that match the master name (case insensitive)
  const agents = [
    eskyAgent, 
    ...dbAgents.filter(a => a.name.toLowerCase().trim() !== eskyAgent.name.toLowerCase().trim())
  ];

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
                const personality = PERSONALITY_LABELS[agent.personalityType] ?? PERSONALITY_LABELS.factory
                const year = new Date(agent.memberSince).getFullYear()

                return (
                  <div
                    key={agent.id}
                    className="bg-black p-6 flex flex-col gap-4 hover:bg-zinc-950 transition-colors group"
                  >
                    {/* Agent Image / Gap Fix */}
                    <div className="aspect-video w-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                      {agent.imageUrl ? (
                        <Image 
                          src={agent.imageUrl} 
                          alt={agent.name} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <Activity className="w-8 h-8 text-orange-400" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 border border-zinc-800 text-[8px] text-zinc-500 uppercase tracking-tighter">
                        v2026.4.23
                      </div>
                    </div>

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
                      {agent.description || agent.expertise || 'Factory-grade AI agent running on OpenClaw.'}
                    </p>

                    {/* Expertise tags */}
                    {agent.expertise && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {String(agent.expertise).split(',').slice(0, 3).map((tag) => (
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

        {/* Open Source Agents */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Open Source</p>
              <h2 className="text-2xl font-bold uppercase tracking-tighter">Example Agents</h2>
            </div>
            <a
              href="https://github.com/Eskyee/agentbot-sdk/tree/main/examples"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-widest text-zinc-500 border border-zinc-800 px-4 py-2 hover:border-zinc-600 hover:text-white transition-colors"
            >
              View on GitHub →
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900">
            {[
              { name: 'Research Agent', desc: 'Web research and analysis. Scans sources, synthesizes findings, produces structured reports.', tools: ['bash', 'read', 'web', 'think', 'memory'], href: 'https://github.com/Eskyee/agentbot-sdk/tree/main/examples/research-agent' },
              { name: 'Outreach Agent', desc: 'Lead generation and cold messaging. Researches prospects, crafts personalized messages, tracks campaigns.', tools: ['read', 'write', 'web', 'think', 'memory'], href: 'https://github.com/Eskyee/agentbot-sdk/tree/main/examples/outreach-agent' },
              { name: 'Content Agent', desc: 'Blog posts, social media, documentation. Adapts tone for different audiences.', tools: ['read', 'write', 'web', 'think', 'memory'], href: 'https://github.com/Eskyee/agentbot-sdk/tree/main/examples/content-agent' },
              { name: 'Crypto Analyst', desc: 'Autonomous 24/7 market scanner. Checks top movers, analyzes projects, produces daily reports.', tools: ['bash', 'read', 'write', 'web', 'think', 'memory'], href: 'https://github.com/Eskyee/agentbot-sdk/tree/main/examples/crypto-analyst' },
              { name: 'Barista Agent', desc: 'Morning motivation and terrible programming jokes. 5 AM survival mode.', tools: ['think', 'memory'], href: 'https://github.com/Eskyee/agentbot-sdk/tree/main/examples/barista-agent' },
              { name: 'Multi-Agent Workflow', desc: 'Compose agents into pipelines: researcher → outreach → content. Full workflow example.', tools: ['bash', 'read', 'write', 'web', 'think', 'memory'], href: 'https://github.com/Eskyee/agentbot-sdk/tree/main/examples/multi-agent-workflow' },
            ].map((agent) => (
              <a
                key={agent.name}
                href={agent.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black p-6 flex flex-col gap-4 hover:bg-zinc-950 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-tight">{agent.name}</h3>
                  <span className="text-[10px] text-zinc-700 shrink-0">MIT</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{agent.desc}</p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {agent.tools.map((tool) => (
                    <span key={tool} className="text-[9px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-0.5">
                      {tool}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>

          <div className="mt-6 text-center">
            <a
              href="https://github.com/Eskyee/agentbot-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Build your own agent → agentbot-sdk on GitHub
            </a>
          </div>
        </div>

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
