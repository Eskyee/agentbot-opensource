import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'OpenClaw v2026.3.23 — Stability & Auth Fixes',
 description: 'Major stability release with 30+ fixes for browser attach, ClawHub auth, gateway reliability, and security hardening.',
 keywords: ['OpenClaw', 'v2026.3.23', 'update', 'release', 'agent'],
 openGraph: {
 title: 'OpenClaw v2026.3.23 Released',
 description: '30+ fixes for browser, auth, gateway, and security. Now live on Agentbot.',
 url: 'https://agentbot.raveculture.xyz/blog/posts/openclaw-2026-3-23',
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
 <p className="text-sm text-zinc-500 mb-2">24 March 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">OpenClaw v2026.3.23</h1>
 <div className="flex gap-2 flex-wrap">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400 border border-blue-800/50">Release</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Stability</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Security</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6">
 OpenClaw v2026.3.23 is now live with <strong>30+ fixes</strong> for browser attach, 
 ClawHub authentication, gateway reliability, and security hardening. Agentbot is already running it.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Highlights</h2>
 
 <div className="grid gap-4 mb-6">
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Browser/Chrome MCP</h3>
 <p className="text-zinc-400 text-sm">
 Existing session tabs now wait for usability after attach. Reduces user-profile timeouts and consent churn on macOS Chrome.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">ClawHub Auth</h3>
 <p className="text-zinc-400 text-sm">
 macOS auth config and XDG paths now honored. Skill browsing uses signed-in state instead of falling back to unauthenticated mode.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Security Hardening</h3>
 <p className="text-zinc-400 text-sm">
 Canvas routes now require auth. Admin scope required for agent session reset. Shell-wrapper exec matching hardened.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Gateway Stability</h3>
 <p className="text-zinc-400 text-sm">
 Gateway probes no longer timeout falsely. Lock conflicts under launchd/systemd no longer crash-loop.
 </p>
 </div>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Full Changelog</h2>
 
 <div className="space-y-4 text-zinc-300 text-sm">
 <div>
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Browser & CDP</h3>
 <ul className="list-disc list-inside text-zinc-400 space-y-1">
 <li>Chrome MCP: wait for existing-session tabs to become usable after attach</li>
 <li>CDP: reuse already-running loopback browser after reachability miss</li>
 </ul>
 </div>
 
 <div>
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">ClawHub & Auth</h3>
 <ul className="list-disc list-inside text-zinc-400 space-y-1">
 <li>Honor macOS auth config and XDG auth paths for saved credentials</li>
 <li>Read local ClawHub login from macOS Application Support path</li>
 <li>Resolve auth token for gateway skill browsing</li>
 </ul>
 </div>
 
 <div>
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Plugins & Channels</h3>
 <ul className="list-disc list-inside text-zinc-400 space-y-1">
 <li>Discord components and Slack blocks made optional</li>
 <li>Feishu media attachments now send correctly</li>
 <li>Matrix duplicate export crash fixed</li>
 <li>DeepSeek provider refactored onto shared plugin entry</li>
 <li>LanceDB auto-bootstrap on first use</li>
 </ul>
 </div>
 
 <div>
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Gateway & Models</h3>
 <ul className="list-disc list-inside text-zinc-400 space-y-1">
 <li>OpenRouter auto pricing recursion fixed</li>
 <li>Mistral max-token defaults lowered to safe budgets</li>
 <li>Web search uses active runtime provider</li>
 <li>Codex OAuth proxy initialization fixed</li>
 </ul>
 </div>
 
 <div>
 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Security</h3>
 <ul className="list-disc list-inside text-zinc-400 space-y-1">
 <li>Canvas routes require auth</li>
 <li>Agent session reset requires admin scope</li>
 <li>Shell-wrapper exec matching hardened</li>
 </ul>
 </div>
 </div>

 <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
 <p className="text-zinc-300 mb-4">Agentbot is already running v2026.3.23</p>
 <div className="flex gap-3">
 <Link href="/demo" className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors">
 Try Demo
 </Link>
 <Link href="https://github.com/openclaw/openclaw/releases/tag/v2026.3.23" className="inline-block bg-zinc-800 text-white px-6 py-2.5 font-medium hover:bg-zinc-700 transition-colors">
 Full Release Notes
 </Link>
 </div>
 </div>
 </article>
 </div>
 </main>
 )
}
