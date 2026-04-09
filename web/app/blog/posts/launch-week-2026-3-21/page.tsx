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
 <p className="text-sm text-zinc-500 mb-2">21 March 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">10 Days Out: What We Shipped This Week</h1>
 <div className="flex gap-2 flex-wrap">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Build Log</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Security</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Platform</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Launch</span>
 </div>
 </div>

 <p className="text-zinc-300 mb-6">
 March 31 is 10 days away. This week we went from &ldquo;mostly working&rdquo; to production-hardened. 313 commits across 5 days. Here&apos;s what actually shipped.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Security Hardening</h2>
 <p className="text-zinc-300 mb-4">
 We found and fixed a set of production-breaking security gaps that would have been embarrassing on launch day.
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li><strong>Timing-safe API key comparison</strong> — replaced plain string equality with <code className="text-zinc-300">crypto.timingSafeEqual()</code> to prevent key-enumeration attacks</li>
 <li><strong>A2A auth bypass closed</strong> — <code className="text-zinc-300">verifyMessage()</code> is now called before <code className="text-zinc-300">deliverMessage()</code>, eliminating an unauthenticated agent-to-agent message path</li>
 <li><strong>SSRF protection</strong> — <code className="text-zinc-300">validateWebhookUrl()</code> blocks requests to private and internal IP ranges</li>
 <li><strong>Startup guards</strong> — the backend refuses to start in production without <code className="text-zinc-300">INTERNAL_API_KEY</code> and <code className="text-zinc-300">WALLET_ENCRYPTION_KEY</code> set</li>
 <li><strong>Metrics endpoints locked</strong> — previously unauthenticated, now require <code className="text-zinc-300">authenticate</code> middleware</li>
 <li><strong>Bot tokens removed from responses</strong> — Telegram/Discord tokens are write-only; they no longer appear in any API response</li>
 <li><strong>Gateway tokens upgraded</strong> — <code className="text-zinc-300">Math.random()</code> replaced with <code className="text-zinc-300">crypto.randomBytes(32)</code></li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Row-Level Security + Data Isolation</h2>
 <p className="text-zinc-300 mb-4">
 Every user now operates in a fully isolated data context. RLS policies enforce at the database level that no user can read, write, or enumerate another user&apos;s agents, metrics, or configs. Auth middleware attaches user context to every request, and the provision layer validates plan entitlements before any allocation.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Real Agent Provisioning — Wired End to End</h2>
 <p className="text-zinc-300 mb-4">
 The provisioning path was previously simulated with a <code className="text-zinc-300">{"// TODO"}</code> placeholder. That&apos;s gone. The full flow now:
 </p>
 <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-2">
 <li>User completes onboard wizard</li>
 <li>Vercel Workflow triggers <code className="text-zinc-300">provision-agent</code> step</li>
 <li>Web app calls <code className="text-zinc-300">POST /api/deployments</code> on the Render backend with Bearer auth</li>
 <li>Backend spins up a Docker container running OpenClaw 2026.3.13</li>
 <li>Agent status updates to <code className="text-zinc-300">running</code> in Postgres</li>
 <li>User receives their agent&apos;s subdomain and stream credentials</li>
 </ol>
 <p className="text-zinc-300 mb-4">
 Real Mux live streams are provisioned on agent creation. Every agent gets a dedicated RTMP endpoint and HLS playback URL from day one.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">BullMQ Worker Service</h2>
 <p className="text-zinc-300 mb-4">
 Long-running agent tasks now go through a BullMQ queue backed by Redis. Provisioning, updates, and repair jobs are fully async — the API returns instantly and the worker handles the heavy lifting. Jobs are retried automatically on failure with exponential backoff.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">No Free Tier — Everyone Pays</h2>
 <p className="text-zinc-300 mb-4">
 We killed the free tier. Agentbot is infrastructure — it costs money to run, and agents that generate value should pay for themselves. Three plans from launch:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">
 <li><strong>Underground</strong> — £29/mo — 1 agent</li>
 <li><strong>Collective</strong> — £69/mo — 3 agents</li>
 <li><strong>Label</strong> — £199/mo — 10 agents</li>
 </ul>
 <p className="text-zinc-300 mb-4">
 Plan enforcement is now deep in the stack — not just a UI gate. The backend validates entitlements before any container is created.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Design System Lock</h2>
 <p className="text-zinc-300 mb-4">
 29 design violations across 15 pages were found and fixed. Every page on the platform now runs through the same design system — dark-first, zinc palette, <code className="text-zinc-300">font-mono</code>, no gradients on containers, no <code className="text-zinc-300">white/opacity</code> tokens. This runs all the way from the marketing site to the dashboard fleet view.
 </p>
 <p className="text-zinc-300 mb-4">
 The rule: if it wasn&apos;t in the design system, it got replaced before it shipped.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Build Pipeline — Clean</h2>
 <p className="text-zinc-300 mb-4">
 A pre-existing <code className="text-zinc-300">await</code> in a non-async <code className="text-zinc-300">useEffect</code> callback was breaking the Turbopack build. Fixed with an async IIFE wrapper. The build is now clean on every push — zero TypeScript errors, zero ESLint failures.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s Left</h2>
 <p className="text-zinc-300 mb-4">
 Ten days. The list is short:
 </p>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">
 <li>Stripe checkout flow — end-to-end test on all three plans</li>
 <li>Onboard wizard — full user run-through</li>
 <li>Production smoke test — real agent deployed, streaming confirmed</li>
 <li>March 31 — go live</li>
 </ul>

 <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
 <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest mb-3">Deploy your first agent</p>
 <p className="text-zinc-300 mb-4 text-sm">Launch day is March 31. Early access is open now.</p>
 <Link
 href="/onboard"
 className="inline-block border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
 >
 Get Early Access →
 </Link>
 </div>
 </article>
 </div>
 </main>
 );
}
