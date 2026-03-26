import Link from 'next/link';

export default function Post() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">19 March 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">BotID: Invisible Protection for AI Agents</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Security</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Bot Protection</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Vercel</span>
 </div>
 </div>

 <p className="text-zinc-300 mb-4">We&apos;ve added Vercel BotID to protect our platform from automated attacks. Here&apos;s why it matters for AI agents.</p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Bot Problem</h2>
 <p className="text-zinc-300 mb-4">Modern bots aren&apos;t the slow, obvious crawlers of the past. They:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Execute JavaScript like real browsers</li>
 <li>Solve CAPTCHAs automatically</li>
 <li>Navigate websites indistinguishable from humans</li>
 <li>Scale attacks across thousands of requests</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What BotID Protects</h2>
 <p className="text-zinc-300 mb-4">We&apos;ve enabled BotID on critical endpoints:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>/api/register</strong> — Prevents fake account creation</li>
 <li><strong>/api/auth/*</strong> — Blocks brute force attacks</li>
 <li><strong>/api/stripe/*</strong> — Protects payment endpoints</li>
 <li><strong>/api/agents/*</strong> — Stops resource abuse</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Zero Friction</h2>
 <p className="text-zinc-300 mb-4">Unlike traditional CAPTCHAs, BotID is invisible:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>No challenges for real users</li>
 <li>No &quot;I&apos;m not a robot&quot; checkboxes</li>
 <li>Seamless protection</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why It Matters for AI Agents</h2>
 <p className="text-zinc-300 mb-4">AI agent platforms are prime targets for:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>Credential stuffing</strong> — Testing stolen passwords</li>
 <li><strong>API abuse</strong> — Draining your AI credits</li>
 <li><strong>Fake accounts</strong> — Free tier exploitation</li>
 <li><strong>Content scraping</strong> — Stealing your training data</li>
 </ul>

 <p className="text-zinc-300 mb-4">BotID stops all of this — automatically.</p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Built on Kasada</h2>
 <p className="text-zinc-300 mb-4">BotID is powered by Kasada, providing:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Real-time threat detection</li>
 <li>Machine learning analysis</li>
 <li>Continuous adaptation to new threats</li>
 <li>Enterprise-grade reliability</li>
 </ul>

 <p className="text-zinc-300 mb-4">We&apos;ve always prioritized security. BotID is just another layer in our defense-in-depth approach.</p>

 <div className="mt-12 pt-8 border-t border-zinc-800">
 <p className="text-zinc-500">- The Agentbot Team </p>
 </div>
 </article>
 </div>
 </main>
 );
}
