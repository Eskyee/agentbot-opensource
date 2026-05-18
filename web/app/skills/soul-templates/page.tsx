import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SOUL.md Templates — Agentbot Skills',
  description: 'Install TV character-based SOUL.md templates for your agents. Monica (Chief of Staff), Dwight (Research), Kelly (Content), and more.',
}

const TEMPLATES = [
  {
    id: 'monica',
    name: 'Monica',
    emoji: '🧹',
    role: 'Chief of Staff',
    energy: 'Organized, driven, exacting',
    lines: 48,
    desc: 'Coordination, delegation, strategic oversight. The one who makes sure everything gets done right.',
  },
  {
    id: 'dwight',
    name: 'Dwight',
    emoji: '🎯',
    role: 'Research Agent',
    energy: 'Thorough, intense, no-nonsense',
    lines: 52,
    desc: 'Intelligence backbone. Research, verify, organize, deliver intel that other agents consume.',
  },
  {
    id: 'kelly',
    name: 'Kelly',
    emoji: '📱',
    role: 'Content Agent',
    energy: 'Knows trends before they trend',
    lines: 46,
    desc: 'Social media content. X/Twitter. Knows what people want to read before they do.',
  },
  {
    id: 'rachel',
    name: 'Rachel',
    emoji: '💼',
    role: 'Thought Leadership',
    energy: 'Sophisticated, strategic, forward-thinking',
    lines: 44,
    desc: 'LinkedIn, long-form, industry analysis. Positions you as a thought leader.',
  },
  {
    id: 'ross',
    name: 'Ross',
    emoji: '🔧',
    role: 'Engineering Agent',
    energy: 'Methodical, precise, systems thinker',
    lines: 50,
    desc: 'Code review, debugging, technical implementation. Understands before fixing.',
  },
  {
    id: 'pam',
    name: 'Pam',
    emoji: '📰',
    role: 'Newsletter Agent',
    energy: 'Warm, clear, accessible',
    lines: 42,
    desc: 'Newsletter writing, digest creation. Makes complex things easy to read.',
  },
  {
    id: 'cipher',
    name: 'Cipher',
    emoji: '🔐',
    role: 'Security Agent',
    energy: 'Paranoid (in a good way), always watching',
    lines: 48,
    desc: 'Security monitoring, threat detection, access control. Zero trust, always.',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    emoji: '⚙️',
    role: 'Operations Agent',
    energy: 'Proactive, thorough, doesn\'t wait',
    lines: 50,
    desc: 'Platform operations, monitoring, deployment, infrastructure. Keeps everything running.',
  },
]

export default function SoulTemplatesPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <Link href="/dashboard/skills" className="text-zinc-400 hover:text-white mb-4 inline-block text-[10px] uppercase tracking-widest">
            ← Back to Skills
          </Link>
          <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-2">Skill Pack</div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">SOUL.md Templates</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            TV character-based personality templates for your agents. 
            &quot;Dwight Schrute energy&quot; = thorough, intense, no-nonsense. 
            30 seasons of character development for free via training data.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map(t => (
            <div key={t.id} className="border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-600 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-[9px] text-zinc-600 font-mono">{t.lines} lines</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{t.name}</h3>
              <div className="text-[10px] text-purple-400 uppercase tracking-widest mb-1">{t.role}</div>
              <p className="text-[10px] text-zinc-500 mb-2">{t.energy}</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-zinc-800 bg-zinc-950 p-6 text-center">
          <div className="text-sm font-bold text-white mb-2">How to Use</div>
          <p className="text-xs text-zinc-400 mb-4">
            Choose a template → Customize the SOUL.md → Deploy to your agent → Refine over 2-3 weeks
          </p>
          <Link href="/agent-team" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
            View Full Guide →
          </Link>
        </div>
      </div>
    </main>
  )
}
