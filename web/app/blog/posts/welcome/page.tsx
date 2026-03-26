import Link from 'next/link';

export default function WelcomePost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">January 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Welcome to Agentbot</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Announcement</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6">
 We built this platform to remove server setup friction and help builders launch AI agents in under a minute.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why We Built This</h2>
 <p className="text-zinc-300 mb-4">
 Deploying AI agents shouldn&apos;t require DevOps expertise. We wanted a platform where anyone could launch a production-ready agent with just a Telegram token and API key.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What Makes Us Different</h2>
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li>Deploy in under 60 seconds</li>
 <li>No server management required</li>
 <li>Automatic scaling & restarts</li>
 <li>Real-time monitoring dashboard</li>
 <li>Pay only for what you use</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Built on OpenClaw</h2>
 <p className="text-zinc-300 mb-4">
 We use OpenClaw as our agent framework. It&apos;s open source, extensible, and supports multiple AI models.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s Next</h2>
 <p className="text-zinc-300 mb-4">
 We&apos;re shipping fast. Custom domains, WhatsApp integration, and a visual agent builder are coming soon.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Join Us</h2>
 <p className="text-zinc-300 mb-4">
 We&apos;re building in public. Follow our progress on Twitter and join our Discord community.
 </p>

 <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
 <p className="text-zinc-300 mb-4">Ready to deploy your first agent?</p>
 <Link href="/signup" className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors">
 Get Started
 </Link>
 </div>
 </article>
 </div>
 </main>
 );
}
