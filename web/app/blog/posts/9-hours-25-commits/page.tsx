import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '9 Hours, 25 Commits, 7 Services — Agentbot',
  description: 'A full day of shipping: browser automation, sandbox, Liquid node, custom domains, workflow SDK, and more. The infrastructure behind autonomous AI agents.',
  keywords: ['AI agents', 'infrastructure', 'shipping', 'platform update'],
  openGraph: {
    title: '9 Hours, 25 Commits, 7 Services',
    description: 'A full day of shipping infrastructure for autonomous AI agents.',
    url: 'https://agentbot.sh/blog/posts/9-hours-25-commits',
  },
}

export default function ShippingDayPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              9 Hours, 25 Commits, 7 Services
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-red-800/50 text-zinc-400">Shipping</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Infrastructure</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Update</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8 text-lg">
            Yesterday we shipped more in 9 hours than most teams ship in a month. 
            Here&apos;s everything — no filler, no marketing, just what we built.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Infrastructure
          </h2>

          <div className="space-y-4 mb-8">
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">🌐 Browser Automation</div>
              <p className="text-xs text-zinc-400">Full Playwright backend on Railway. Navigate, screenshot, extract, click, type, fill forms, multi-step workflows. Not a placeholder — real headless Chrome.</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">🖥 Vercel Sandbox</div>
              <p className="text-xs text-zinc-400">Isolated code execution in Firecracker microVMs. Node.js 24, Python 3.13. Safe execution of untrusted/agent-generated code.</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">⛓ Elements Liquid Node</div>
              <p className="text-xs text-zinc-400">Pruned Elements node (1GB) on Railway. Syncing Liquid Network. Wired to Bitcoin dashboard for Jade air-gap signing.</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">🌍 Custom Domains</div>
              <p className="text-xs text-zinc-400">Enterprise multi-tenant domain management. Vercel SDK integration. Auto SSL. Up to 10 custom domains per enterprise user.</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">⇄ Workflow SDK</div>
              <p className="text-xs text-zinc-400">Vercel Workflow SDK integration. Durable, resumable workflows. Onboarding, research, monitoring, content creation.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Platform
          </h2>

          <div className="space-y-4 mb-8">
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">🔐 Jade Air-Gap Signing</div>
              <p className="text-xs text-zinc-400">3-step QR code flow for Blockstream Jade. Create TX → Scan with Jade → Broadcast. No USB, no internet.</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">📱 Device Pairing</div>
              <p className="text-xs text-zinc-400">"Pair My iPhone" button. Online status indicator. Auto-approve self-pairing.</p>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-bold text-white mb-1">🐣 Blockchain Buddies</div>
              <p className="text-xs text-zinc-400">Saves progress to database. Feed, play, train. XP/level/energy/happiness system. Max 20 buddies per user.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Vercel Optimization
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-500">Fluid Compute:</span> <span className="text-emerald-400">Enabled</span></div>
              <div><span className="text-zinc-500">Regions:</span> <span className="text-white">iad1 + lhr1</span></div>
              <div><span className="text-zinc-500">Failover:</span> <span className="text-white">sfo1</span></div>
              <div><span className="text-zinc-500">Git Protection:</span> <span className="text-emerald-400">Feature branches blocked</span></div>
              <div><span className="text-zinc-500">Security Headers:</span> <span className="text-emerald-400">X-Frame, X-Content-Type</span></div>
              <div><span className="text-zinc-500">Build Optimization:</span> <span className="text-emerald-400">Docs-only skip</span></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Content & Community
          </h2>

          <ul className="list-disc pl-6 text-zinc-300 mb-6 space-y-1">
            <li>3 blog posts (baseFM open source, agentic infrastructure, shipping update)</li>
            <li>Social proof section on homepage (78 pages, 130+ APIs, 34 models)</li>
            <li>"Try Free for 7 Days" CTA</li>
            <li>Community recipes page (6 starter recipes)</li>
            <li>Security white paper</li>
            <li>Product Hunt launch plan (April 14)</li>
            <li>KiloClaw competitive analysis</li>
            <li>Developer logos (Base, OpenClaw, Next.js, Vercel, Railway, Neon)</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Token & Config
          </h2>

          <ul className="list-disc pl-6 text-zinc-300 mb-6 space-y-1">
            <li>Solana $AGENTBOT updated (new Pump.fun address)</li>
            <li>Community ownership disclaimer on token page</li>
            <li>MiMo Max plan ($100/mo, 1.6B credits) configured</li>
            <li>API key rotated and vaulted</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Numbers
          </h2>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-3xl font-bold text-white">25+</div>
              <div className="text-[10px] text-zinc-500 uppercase">Commits</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-3xl font-bold text-white">7</div>
              <div className="text-[10px] text-zinc-500 uppercase">Services</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-3xl font-bold text-white">3</div>
              <div className="text-[10px] text-zinc-500 uppercase">Blog Posts</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="text-3xl font-bold text-white">9h</div>
              <div className="text-[10px] text-zinc-500 uppercase">Duration</div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold uppercase tracking-tight mb-3">What&apos;s Next</h3>
            <ul className="text-sm text-zinc-400 space-y-1 list-disc pl-4">
              <li>Product Hunt launch (April 14)</li>
              <li>Security white paper published</li>
              <li>Browser automation connected to AI models</li>
              <li>More community recipes</li>
              <li>Press outreach (TechCrunch, VentureBeat)</li>
            </ul>
          </div>

          <p className="text-zinc-400 text-sm">
            Built by <Link href="https://github.com/Eskyee" className="text-white underline">Eskyee</Link> and <span className="text-white">Atlas</span> in 9 hours.
            <br/>
            <Link href="https://github.com/Eskyee/agentbot-opensource" className="text-white underline">github.com/Eskyee/agentbot-opensource</Link>
          </p>
        </article>
      </div>
    </main>
  )
}
