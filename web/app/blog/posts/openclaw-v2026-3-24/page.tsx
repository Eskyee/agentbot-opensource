import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Agentbot Now Runs OpenClaw v2026.3.24',
 description: 'Gateway OpenAI compatibility, security fix, CLI container support, channel isolation, and restart recovery.',
 keywords: ['OpenClaw', 'v2026.3.24', 'update', 'release', 'agent', 'gateway'],
 openGraph: {
 title: 'Agentbot Now Runs OpenClaw v2026.3.24',
 description: 'Gateway OpenAI compatibility, security fix, CLI container support, channel isolation.',
 url: 'https://agentbot.raveculture.xyz/blog/posts/openclaw-v2026-3-24',
 },
}

export default function OpenClawReleasePost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">26 March 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">OpenClaw v2026.3.24</h1>
 <div className="flex gap-2 flex-wrap">
 <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Release</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Gateway</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Security</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6">
 We&apos;ve updated Agentbot to OpenClaw v2026.3.24 — the latest release from the OpenClaw team.
 This brings <strong>security fixes</strong>, broader <strong>API compatibility</strong>, and improved
 developer tooling for our agent platform.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s New</h2>
 
 <div className="grid gap-4 mb-6">
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Gateway OpenAI Compatibility</h3>
 <p className="text-zinc-400 text-sm">
 Agent containers now expose <code>/v1/models</code> and <code>/v1/embeddings</code> endpoints, 
 matching the OpenAI API spec. Model overrides pass through <code>/v1/chat/completions</code> and 
 <code>/v1/responses</code> for fine-grained control. RAG clients and embedding workflows work out of the box.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Security: Media Dispatch Fix</h3>
 <p className="text-zinc-400 text-sm">
 Closes a <code>mediaUrl</code>/<code>fileUrl</code> alias bypass that could let outbound tool actions 
 escape media-root restrictions. We&apos;ve audited our file routes and confirmed our path traversal 
 mitigations are solid — this upstream fix adds another layer of defense.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">CLI Container Support</h3>
 <p className="text-zinc-400 text-sm">
 New <code>--container</code> flag and <code>OPENCLAW_CONTAINER</code> env var let you run OpenClaw 
 commands inside a running Docker container without exec&apos;ing in. Easier debugging and configuration 
 for Docker agent users.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Channel Isolation</h3>
 <p className="text-zinc-400 text-sm">
 Gateway channels now start sequentially with isolated boot failures. One broken channel no longer 
 blocks others from starting. Better reliability for multi-channel setups.
 </p>
 </div>

 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Restart Recovery</h3>
 <p className="text-zinc-400 text-sm">
 Gateway restarts now wake interrupted sessions via heartbeat. Outbound delivery retries once on 
 transient failure. Thread/topic routing is preserved through the wake path — replies land where they should.
 </p>
 </div>

 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Skills Install Metadata</h3>
 <p className="text-zinc-400 text-sm">
 Bundled skills now include one-click install recipes. When a skill needs dependencies, the CLI 
 and Control UI can offer automatic installation. Cleaner onboarding for new users.
 </p>
 </div>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What We Updated</h2>
 
 <div className="overflow-x-auto mb-6">
 <table className="w-full text-sm text-left">
 <thead className="text-xs uppercase text-zinc-500 border-b border-zinc-800">
 <tr>
 <th className="py-3 pr-4">Component</th>
 <th className="py-3 pr-4">Old Version</th>
 <th className="py-3">New Version</th>
 </tr>
 </thead>
 <tbody className="text-zinc-300">
 <tr className="border-b border-zinc-900">
 <td className="py-3 pr-4">Docker agent image</td>
 <td className="py-3 pr-4 font-mono text-zinc-500">2026.3.22</td>
 <td className="py-3 font-mono text-white">2026.3.24</td>
 </tr>
 <tr className="border-b border-zinc-900">
 <td className="py-3 pr-4">Backend default image</td>
 <td className="py-3 pr-4 font-mono text-zinc-500">2026.3.13</td>
 <td className="py-3 font-mono text-white">2026.3.24</td>
 </tr>
 <tr className="border-b border-zinc-900">
 <td className="py-3 pr-4">Version endpoint</td>
 <td className="py-3 pr-4 font-mono text-zinc-500">2026.3.13</td>
 <td className="py-3 font-mono text-white">2026.3.24</td>
 </tr>
 </tbody>
 </table>
 </div>

 <p className="text-zinc-400 text-sm mb-8">
 All 7 references updated across the codebase. Zero breaking changes for existing agents.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What This Means for You</h2>
 
 <ul className="space-y-2 text-zinc-300 text-sm mb-8">
 <li className="flex items-start gap-2">
 <span className="text-blue-400">→</span>
 <span><strong>Better API compatibility</strong> — more tools and clients work with Agentbot out of the box</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="text-blue-400">→</span>
 <span><strong>Stronger security</strong> — upstream fix for media dispatch bypass</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="text-blue-400">→</span>
 <span><strong>Easier debugging</strong> — <code>--container</code> flag for Docker agent inspection</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="text-blue-400">→</span>
 <span><strong>More reliable</strong> — channel isolation and restart recovery</span>
 </li>
 </ul>

 <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
 <p className="text-zinc-300 mb-4">
 Agentbot tracks OpenClaw releases closely — every improvement is automatic for your agents.
 </p>
 <div className="flex gap-3">
 <Link href="/demo" className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors">
 Try Demo
 </Link>
 <Link href="https://github.com/openclaw/openclaw/releases/tag/v2026.3.24" className="inline-block bg-zinc-800 text-white px-6 py-2.5 font-medium hover:bg-zinc-700 transition-colors">
 Full Release Notes
 </Link>
 </div>
 </div>
 </article>
 </div>
 </main>
 )
}
