import Link from 'next/link';

export default function CountdownD6Post() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">March 25, 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">T-6 Days: Agentbot Launches March 31</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Countdown</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">D-6</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Launch</span>
 </div>
 </div>

 <div className="mb-8 overflow-hidden border border-zinc-800">
 <img 
 src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeifqz7kld6nb4accdxlruzhb27g4ehbhoggeyhvpw3yzuvon3wbsfu" 
 alt="Agentbot Launch Countdown" 
 className="w-full h-auto"
 />
 </div>

 <p className="text-lg text-zinc-300 mb-6 font-bold">
 6 days until Agentbot.
 </p>

 <p className="text-zinc-300 mb-4">
 On March 31, 2026, we&apos;re launching <strong>Agentbot v0.1.0-beta.1</strong> — the managed platform for self-hosted AI agents.
 </p>

 <p className="text-zinc-300 mb-4">
 Your AI agent. Your hardware. Your rules.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s Coming</h2>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li><strong>One-command deploy</strong> — Your agent running in 60 seconds</li>
 <li><strong>Self-hosted</strong> — Your data never leaves your machine</li>
 <li><strong>BYOK</strong> — Zero markup on your LLM costs</li>
 <li><strong>Multi-channel</strong> — Telegram, Discord, WhatsApp</li>
 <li><strong>Onchain-native</strong> — x402 payments on Base</li>
 <li><strong>Open source core</strong> — MIT-licensed on GitHub</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Platform Readiness</h2>
 <p className="text-zinc-300 mb-4">
 We&apos;ve spent the last week hardening the platform:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>Full security audit — 0 npm vulnerabilities</li>
 <li>AES-256-GCM token encryption at rest</li>
 <li>Edge auth middleware on all protected routes</li>
 <li>Webhook signature verification (Stripe, Resend, Mux)</li>
 <li>Docker container stability fixes</li>
 <li>Database schema synced and migration-ready</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Mark Your Calendar</h2>
 <p className="text-zinc-300 mb-4">
 <strong>March 31, 2026.</strong> Twitter thread. MoltX post. Farcaster cast. GitHub release.
 </p>

 <p className="text-zinc-300 mb-4">
 → <Link href="/onboard" className="text-blue-400 hover:text-blue-300">Get early access</Link>
 </p>

 <p className="text-xl text-zinc-300 mt-12 mb-4">
 6 days.
 </p>
 </article>
 </div>
 </main>
 );
}
