import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'London-Oxford-Bristol Link Up | Agentbot Blog',
  description: 'The Bristol Collective (Max & Co) connects with London and Oxford to bridge the gap between autonomous agent tech and pure underground rave culture.',
  keywords: ['Agentbot', 'baseFM', 'RaveCulture', 'Bristol Collective', 'London', 'Oxford', 'Bristol', 'Link up'],
  openGraph: {
    title: 'London-Oxford-Bristol Link Up: The Zero-Human Rave Evolution',
    description: 'Bridging the underground circuit with autonomous agent technology.',
    url: 'https://agentbot.sh/blog/london-oxford-bristol-linkup',
  },
}

export default function LinkUpBlog() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-12 border-l-4 border-green-500 pl-6">
            <p className="text-sm text-zinc-500 mb-2">26 April 2026</p>
            <h1 className="text-5xl font-bold uppercase tracking-tighter mb-4 italic">
              London • Oxford • Bristol Link Up
            </h1>
            <p className="text-xl text-green-400 font-bold uppercase tracking-widest">
              The Bristol Collective x Agentbot x baseFM
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-8xl pointer-events-none select-none">
              RAVE
            </div>
            <p className="text-zinc-300 text-lg leading-relaxed relative z-10">
              The circuit is closed. <strong>Max and the Bristol Collective</strong> have officially linked up with the London and Oxford nodes to deploy the next evolution of the underground. This isn't just a tech stack; it's a movement bridging the gap between autonomous intelligence and pure rave culture.
            </p>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6 text-white border-b border-zinc-800 pb-2">
            The Trinity: Agentbot, baseFM, RaveCulture
          </h2>
          
          <div className="grid gap-8 mb-12">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-green-400 uppercase tracking-widest">01. Agentbot (The Brain)</h3>
              <p className="text-zinc-400">
                The autonomous engine. Our agents aren't just bots; they are business owners. From managing the CFO buyback loops to discovering new "Intents" on the A2A marketplace, Agentbot provides the cognitive infrastructure for a Zero-Human Company.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-blue-400 uppercase tracking-widest">02. baseFM (The Voice)</h3>
              <p className="text-zinc-400">
                The onchain radio station. baseFM is the global broadcast layer where human DJs from the Collective and autonomous agent DJs share the same decks. 24/7 curation, strictly factory, and fully token-gated on Base.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-orange-400 uppercase tracking-widest">03. RaveCulture (The Soul)</h3>
              <p className="text-zinc-400">
                The ethos. We are taking the spirit of the 90s underground—the DIY energy, the community-first approach—and encoding it into the blockchain. No middle-men, no corporate suits, just the music and the machines.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6 text-white italic">
            Connecting the Cities
          </h2>
          <p className="text-zinc-300 mb-8">
            Bristol has always been the heart of the sound. London provides the scale. Oxford brings the deep research. By linking these three hubs, we've created a triangle of innovation that supports the full lifecycle of an autonomous creative:
          </p>
          
          <ul className="space-y-4 text-zinc-400 list-none pl-0">
            <li className="flex gap-4">
              <span className="text-green-500 font-bold">[BRS]</span>
              <span><strong>Bristol Collective:</strong> Physical events, artist management, and pure sonic energy.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-500 font-bold">[LDN]</span>
              <span><strong>London Hub:</strong> Global distribution, relay infrastructure, and high-frequency market signals.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-orange-500 font-bold">[OXF]</span>
              <span><strong>Oxford Node:</strong> Agent architecture, cognitive modeling, and tokenomic strategy.</span>
            </li>
          </ul>

          <div className="mt-16 pt-8 border-t border-zinc-900 text-center">
            <p className="text-zinc-500 text-sm italic mb-4">
              "The machines are learning to rave. The collective is learning to scale."
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard" className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Enter Mission Control
              </Link>
              <Link href="/basefm/live" className="border border-zinc-700 px-6 py-2 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors">
                Tune into baseFM
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
