import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MiMo × Agentbot — Partnership',
  description: 'Agentbot is the first managed AI agent platform powered by Xiaomi MiMo V2.5. 99% cheaper inference, 1M context, BYOK support. MiMo-V2.5 限免中.',
}

export default function MimoPartnerPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden pt-14">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Partnership
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              MiMo V2.5
            </div>
            <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/40 text-orange-400 text-[10px] uppercase tracking-widest">
              MiMo-V2.5 限免中
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            MiMo ×<br />
            <span className="text-orange-500">Agentbot</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            The first managed AI agent platform powered by Xiaomi MiMo V2.5.
            Every agent runs on MiMo. Every plan includes inference.
            No per-token charges. No surprise bills.
          </p>
        </div>
      </section>

      {/* Integration Depth */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-8">How It Works</div>

          {/* Direct path: agent → Agentbot gateway → MiMo (no proxy) */}
          <svg viewBox="0 0 720 210" role="img" aria-label="Your agent talks to the Agentbot gateway which connects directly to Xiaomi MiMo — no proxy — across the full model suite" className="mb-10 w-full h-auto">
            {/* Agent */}
            <rect x="10" y="84" width="130" height="48" fill="#09090b" stroke="#27272a" />
            <text x="75" y="106" textAnchor="middle" fill="#fafafa" fontSize="11" fontFamily="monospace" letterSpacing="1">YOUR AGENT</text>
            <text x="75" y="122" textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">OpenClaw</text>
            <line x1="140" y1="108" x2="186" y2="108" stroke="#3f3f46" strokeDasharray="4 4" />
            <polygon points="186,104 194,108 186,112" fill="#EF6F2E" />
            {/* Agentbot gateway */}
            <rect x="196" y="74" width="150" height="68" fill="none" stroke="#EF6F2E" strokeOpacity="0.5" />
            <text x="271" y="98" textAnchor="middle" fill="#EF6F2E" fontSize="11" fontFamily="monospace" letterSpacing="1">AGENTBOT</text>
            <text x="271" y="114" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="monospace">gateway · BYOK</text>
            <text x="271" y="128" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace">direct · no proxy</text>
            <line x1="346" y1="108" x2="392" y2="108" stroke="#3f3f46" strokeDasharray="4 4" />
            <polygon points="392,104 400,108 392,112" fill="#EF6F2E" />
            {/* MiMo */}
            <rect x="402" y="74" width="150" height="68" fill="#09090b" stroke="#27272a" />
            <text x="477" y="98" textAnchor="middle" fill="#fafafa" fontSize="11" fontFamily="monospace" letterSpacing="1">XIAOMI MiMo</text>
            <text x="477" y="114" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace">xiaomimimo.com</text>
            <text x="477" y="128" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="monospace">zero overhead</text>
            {/* model suite fan-out */}
            {[
              { y: 36, label: 'mimo-v2.5-pro' },
              { y: 84, label: 'mimo-v2.5' },
              { y: 132, label: 'v2.5-tts' },
              { y: 168, label: 'v2.5-asr' },
            ].map((m) => (
              <g key={m.label}>
                <line x1="552" y1="108" x2="600" y2={m.y + 14} stroke="#27272a" />
                <rect x="600" y={m.y} width="110" height="28" fill="#09090b" stroke="#27272a" />
                <text x="655" y={m.y + 18} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="monospace">{m.label}</text>
              </g>
            ))}
          </svg>

          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Integration Depth</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              {
                title: 'Direct API',
                body: 'Agentbot connects directly to token-plan-ams.xiaomimimo.com — not through OpenRouter or any proxy. Zero latency overhead.',
              },
              {
                title: 'Default Model',
                body: 'Every agent deployed on Agentbot uses MiMo V2.5 Pro as primary. Not an option — the default.',
              },
              {
                title: 'BYOK Support',
                body: 'Users bring their own MiMo subscription. Settings → BYOK → paste key. Gateway routes through their credits.',
              },
              {
                title: 'Full Model Suite',
                body: 'mimo-v2.5-pro (reasoning), mimo-v2.5 (multimodal), mimo-v2.5-tts (voice), mimo-v2.5-asr (speech).',
              },
            ].map((item) => (
              <div key={item.title} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.title}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why MiMo */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Why MiMo</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            The economics changed. <span className="text-orange-500">We moved first.</span>
          </h2>
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed max-w-lg">
            <p>
              When Xiaomi dropped MiMo V2.5 with a 99% price reduction, 3-5x more credits on Token Plans, and full credit resets — we saw the future of AI agents. Flat-rate inference. No per-token billing. Users just use their agent without thinking about cost.
            </p>
            <p>
              We migrated from OpenRouter to direct MiMo integration in one day. Every agent on the platform now runs on MiMo V2.5 Pro. Our users get faster inference, longer context, and zero surprise bills.
            </p>
            <p>
              MiMo isn't a budget model — it's a frontier model at frontier-beating prices. Cache hits cost 120x less than misses thanks to HiCache optimization. TTS is free for a limited time. MiMo-V2.5 限免中 — try it now before the free trial ends. This is the model that makes always-on AI agents economically viable.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Token Plan Tiers</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900">
            {[
              { stat: '$6', label: 'Lite · 4.1B', sub: 'Light use' },
              { stat: '$16', label: 'Standard · 11B', sub: 'Most users' },
              { stat: '$50', label: 'Pro · 38B', sub: 'Heavy workloads' },
              { stat: '$100', label: 'Max · 82B', sub: 'Power users' },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 text-center">
                <div className="text-2xl font-bold text-orange-500">{item.stat}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2">{item.label}</div>
                <div className="text-[9px] text-zinc-700 mt-1">{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900">
            {[
              { stat: '100%', label: 'MiMo Native' },
              { stat: '9', label: 'Models' },
              { stat: '120x', label: 'Cache Savings' },
              { stat: '24/7', label: 'Always On' },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 text-center">
                <div className="text-2xl font-bold text-orange-500">{item.stat}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Open Source</div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">
            We built it in the open.
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg leading-relaxed mb-8">
            Our MiMo integration code is open source. If you're building an agent platform, a
            coding assistant, or any AI product — you can use our integration directly. We want
            more developers building on MiMo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://github.com/Eskyee/agentbot-opensource"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              View Source on GitHub
            </a>
            <Link
              href="/blog/posts/agentbot-mimo-native"
              className="inline-flex items-center justify-center border border-zinc-800 px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Read Technical Blog
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
            Ready to deploy<br />
            <span className="text-orange-500">on MiMo?</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Every agent on Agentbot runs on MiMo V2.5 Pro. Flat-rate plans. No per-token charges.
            BYOK supported. <span className="text-orange-400 font-bold">MiMo-V2.5 限免中</span> — free trial active now.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            Deploy Your Agent →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-2">
              <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
                Partnership
              </div>
              <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
                MiMo V2.5
              </div>
              <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/40 text-orange-400 text-[10px] uppercase tracking-widest">
                MiMo-V2.5 限免中
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
              MiMo × <span className="text-orange-500">Agentbot</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-700">
              Powered by MiMo · Built on OpenClaw
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
