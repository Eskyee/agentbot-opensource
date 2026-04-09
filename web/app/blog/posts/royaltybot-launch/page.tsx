import Link from 'next/link';

export const metadata = {
 title: 'Introducing RoyaltyBot: Instant Payment Layer for Music',
 date: '18 March 2026',
 excerpt: 'Reprtoir calculates your splits. We execute them instantly. Welcome to the autonomous payment layer the music industry has been waiting for.',
 tags: ['Launch', 'Payments', 'RoyaltyBot', 'USDC', 'Base'],
};

export default function RoyaltyBotLaunch() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="max-w-3xl mx-auto">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>

 <div className="mb-8">
 <div className="flex gap-2 mb-4">
 {metadata.tags.map(tag => (
 <span key={tag} className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">
 {tag}
 </span>
 ))}
 </div>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Introducing RoyaltyBot: Instant Payment Layer for Music</h1>
 <p className="text-zinc-400 text-sm">{metadata.date}</p>
 </div>

 <article className="prose prose-invert max-w-none">
 <p className="text-lg text-zinc-300 leading-relaxed mb-8">
 <span className="text-zinc-300 font-bold">Reprtoir calculates your splits.</span> We execute them instantly. 
 Welcome to the autonomous payment layer the music industry has been waiting for.
 </p>

 <h2 className="text-xl font-bold uppercase tracking-tighter mt-12 mb-4">The Problem: Royalty Payments Are Broken</h2>
 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 Here&apos;s how royalty payments work today: DSPs calculate your streaming revenue → send to distributor → 
 distributor calculates your split → 60-90 days later, it hits your bank account. And that&apos;s if you&apos;re lucky.
 </p>
 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 For independent artists working with producers, labels, or collectives? The math gets messy, 
 transparency is a myth, and waiting 3 months for money you earned today is unacceptable in 2026.
 </p>

 <h2 className="text-xl font-bold uppercase tracking-tighter mt-12 mb-4">Our Solution: RoyaltyBot</h2>
 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 We&apos;ve built the missing layer between royalty calculation and artist wallets. 
 RoyaltyBot is an autonomous payment agent that:
 </p>
 <ul className="list-disc list-inside text-zinc-400 text-sm space-y-2 mb-6">
 <li>Ingests DSP earnings data from Spotify, Apple Music, and more</li>
 <li>Executes split rules automatically (artist/producer/label/writer)</li>
 <li>Pays instantly in USDC when thresholds are hit</li>
 <li>Every transaction is verifiable on-chain</li>
 </ul>

 <div className="bg-zinc-950/50 border border-zinc-800 p-6 my-8">
 <h3 className="text-zinc-300 font-bold uppercase tracking-tighter mb-2">The Numbers</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <div className="text-3xl font-bold">90 days → 3 seconds</div>
 <div className="text-sm text-zinc-400">Traditional payment vs RoyaltyBot</div>
 </div>
 <div>
 <div className="text-3xl font-bold">0%</div>
 <div className="text-sm text-zinc-400">Human involvement required</div>
 </div>
 </div>
 </div>

 <h2 className="text-xl font-bold uppercase tracking-tighter mt-12 mb-4">Not Just Streaming: Booking Payments Too</h2>
 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 We&apos;ve also launched the <span className="text-zinc-300 font-bold">Booking Settlement Agent</span>. 
 It handles:
 </p>
 <ul className="list-disc list-inside text-zinc-400 text-sm space-y-2 mb-6">
 <li>Escrow contracts for booking deposits</li>
 <li>Auto-split guarantee + backend after gigs</li>
 <li>Multi-party splits (artist/agent/manager)</li>
 <li>Instant USDC release on gig completion</li>
 </ul>

 <h2 className="text-xl font-bold uppercase tracking-tighter mt-12 mb-4">Why USDC on Base?</h2>
 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 Because it&apos;s the only way to do instant, verifiable, self-custody payments. No bank delays. 
 No middlemen. No &quot;approaching real-time&quot; promises. Artists own their wallets, agents execute 
 the splits, and money moves in seconds.
 </p>

 <h2 className="text-xl font-bold uppercase tracking-tighter mt-12 mb-4">Pricing</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-px my-8 border border-zinc-800">
 <div className="bg-zinc-950/50 border border-zinc-800 p-6">
 <h3 className="font-bold uppercase tracking-tighter mb-2">Artist</h3>
 <div className="text-3xl font-bold mb-2">£19<span className="text-lg font-normal text-zinc-400">/mo</span></div>
 <p className="text-sm text-zinc-400">1 agent, 3 releases, manual trigger</p>
 </div>
 <div className="bg-zinc-950/50 border border-zinc-800 p-6">
 <h3 className="font-bold uppercase tracking-tighter mb-2">Crew</h3>
 <div className="text-3xl font-bold mb-2">£49<span className="text-lg font-normal text-zinc-400">/mo</span></div>
 <p className="text-sm text-zinc-400">3 agents, 20 releases, auto-trigger</p>
 </div>
 <div className="bg-zinc-950/50 border border-zinc-800 p-6">
 <h3 className="font-bold uppercase tracking-tighter mb-2">Label</h3>
 <div className="text-3xl font-bold mb-2">£149<span className="text-lg font-normal text-zinc-400">/mo</span></div>
 <p className="text-sm text-zinc-400">10 agents, unlimited releases, API</p>
 </div>
 <div className="bg-zinc-950/50 border border-zinc-800 p-6">
 <h3 className="font-bold uppercase tracking-tighter mb-2">Enterprise</h3>
 <div className="text-3xl font-bold mb-2">£399<span className="text-lg font-normal text-zinc-400">/mo</span></div>
 <p className="text-sm text-zinc-400">Unlimited, white-label, SLA</p>
 </div>
 </div>

 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 Plus 0.5% transaction fee (waived on Label tier+).
 </p>

 <h2 className="text-xl font-bold uppercase tracking-tighter mt-12 mb-4">The Bigger Picture</h2>
 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 We&apos;re not replacing the accounting tools like Reprtoir. We&apos;re becoming the payment layer 
 that makes their output actually reach artists&apos; wallets. They do calculation. We do execution.
 </p>
 <p className="text-zinc-400 text-sm leading-relaxed mb-6">
 This is where our Base + CDP + A2A stack creates a moat nobody else has. 
 Autonomous agents that negotiate, calculate, and execute payments — without a single human in the loop.
 </p>

 <div className="mt-12 pt-8 border-t border-zinc-800">
 <Link 
 href="/signup" 
 className="inline-flex items-center justify-center border border-zinc-800 px-8 py-4 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
 >
 Deploy Your RoyaltyBot →
 </Link>
 <p className="mt-4 text-zinc-500 text-sm">
 Or <Link href="/demo" className="text-zinc-400 hover:text-white">try the demo</Link> first
 </p>
 </div>
 </article>
 </div>
 </main>
 );
}
