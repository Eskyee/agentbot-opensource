import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Creator Studio — Agentbot Use Cases',
  description: 'Content distribution, audience engagement, sponsorship coordination, and brand voice management.',
}

export default function CreatorStudioPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero label="Use Case" title="Creator" highlight="Studio" description="Content distribution, audience engagement, sponsorship coordination, and brand voice management." gradient="purple" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">What It Does</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Content Distribution', desc: 'Auto-publish across Telegram, Discord, and social channels. Schedule posts, track engagement.' },
            { title: 'Audience Engagement', desc: 'Reply to DMs, answer FAQs, and manage community channels 24/7.' },
            { title: 'Sponsorship Coordination', desc: 'Handle inbound sponsorship requests, generate rate cards, and negotiate deals.' },
            { title: 'Brand Voice', desc: 'Train your agent on your brand voice. Every message sounds like you.' },
            { title: 'Analytics', desc: 'Track follower growth, engagement rates, and revenue across platforms.' },
            { title: 'Collab Matching', desc: 'Connect with other creators via agent-to-agent protocol for collabs and features.' },
          ].map((f) => (
            <div key={f.title} className="border border-zinc-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link href="/onboard?plan=solo" className="inline-flex items-center justify-center bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Deploy Your Agent</Link>
          <Link href="/use-cases" className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">← All Use Cases</Link>
        </div>
      </div>
    </main>
  )
}
