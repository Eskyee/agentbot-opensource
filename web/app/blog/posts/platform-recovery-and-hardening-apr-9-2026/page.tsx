import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'Platform Recovery, Mainnet Bitcoin, and Production Guardrails - Agentbot',
  description:
    'How we repaired the Railway stack, moved Bitcoin to mainnet, stabilized the wallet/runtime path, and added better production protection around Agentbot.',
  openGraph: {
    title: 'Platform Recovery, Mainnet Bitcoin, and Production Guardrails',
    description:
      'A build log on repairing production, cutting Bitcoin over to mainnet, and tightening the operational guardrails around Agentbot.',
    url: buildAppUrl('/blog/posts/platform-recovery-and-hardening-apr-9-2026'),
  },
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">9 Apr 2026</div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-6">
            Platform Recovery, Mainnet Bitcoin & Production Guardrails
          </h1>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Operations</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Railway</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Bitcoin</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Build Log</span>
          </div>
        </header>

        <div className="prose prose-invert prose-zinc max-w-none">
          <p className="text-xl text-zinc-300 mb-8">
            The last stretch has been less about shiny features and more about making the platform dependable.
            We had real infrastructure damage, stale Railway state, broken backend wiring, and public surfaces
            that were showing the wrong thing. This post is the short version of what we fixed.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Railway Recovery</h2>
          <p className="text-zinc-400 mb-4">
            The Agentbot production stack had drifted badly after Railway damage and stale configuration paths.
            We relinked the project to the correct Railway environment, restored the backend control plane,
            and got the OpenClaw runtime path back into a working state.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>Reattached production to the correct Railway project</li>
            <li>Restored the backend service and health contract</li>
            <li>Repaired frontend → backend → runtime provisioning flow</li>
            <li>Removed stale host assumptions from active app code paths</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Base Wallet First</h2>
          <p className="text-zinc-400 mb-4">
            We made Base the clear default wallet rail. Sign-in, send/receive, and wallet UX are now aligned
            around the actual Base account path instead of mixing product concepts together.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>Base-first wallet page and receive flow</li>
            <li>Cleaner send state and recent activity</li>
            <li>Sponsored-first USDC send path where available</li>
            <li>Tempo/MPP kept as a secondary agent billing lane</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Bitcoin Advanced Rail on Mainnet</h2>
          <p className="text-zinc-400 mb-4">
            Bitcoin is still the advanced rail, not the default onboarding path, but it now runs on mainnet.
            We rebuilt the NBXplorer path on Railway, cut the backend over to mainnet, and removed the old testnet
            path from deployment.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>Mainnet `bitcoind` + `bitcoin-backend-mainnet` live on Railway</li>
            <li>Agentbot backend now reads the mainnet NBXplorer service</li>
            <li>Old testnet services and orphaned volumes were cleaned up</li>
            <li>Bitcoin dashboard now better reflects the advanced watch-only wallet path</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Queueing and Control-Plane Hardening</h2>
          <p className="text-zinc-400 mb-4">
            We also spent time making the platform less fragile under load and less dependent on lucky client behavior.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>Provisioning moved onto durable backend jobs</li>
            <li>Heavy chat/gateway work was pulled off the hottest request paths</li>
            <li>Worker separation improved between API and background execution</li>
            <li>Guardrails added around concurrency and deployment flows</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Production Protection</h2>
          <p className="text-zinc-400 mb-4">
            One of the most important changes was operational, not visual. We started treating the production
            Railway project as something that needs explicit protection from accidental damage, including from AI-assisted ops work.
          </p>
          <ul className="list-disc list-inside text-zinc-400 mb-6 space-y-2">
            <li>Added a staging environment for safer changes</li>
            <li>Created a scoped Railway project token for production operations</li>
            <li>Rotated live control-plane token usage away from the broader token</li>
            <li>Added a runbook in the repo for future production changes</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Why This Matters</h2>
          <p className="text-zinc-400 mb-6">
            We want Agentbot to feel like something you can actually rely on, not just something that demos well.
            That means repairing the boring parts, tightening drift, and cleaning up production assumptions when they go stale.
            This is the kind of work that keeps the rest of the roadmap possible.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-12">
            <h3 className="font-bold mb-2">Current direction</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Base stays the primary user path. Bitcoin stays the advanced rail. OpenClaw remains the managed runtime.
              The focus now is reliability, operator clarity, and continuing to clean up the public/open-source release path.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href="/showcase" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
                View showcase
              </a>
              <a href="/dashboard/wallet" className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors">
                Wallet
              </a>
              <a href="/dashboard/bitcoin" className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors">
                Bitcoin
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <a href="/blog" className="text-zinc-500 hover:text-white text-sm">
            ← Back to Blog
          </a>
        </div>
      </article>
    </main>
  )
}
