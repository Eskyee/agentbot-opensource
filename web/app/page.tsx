import Link from 'next/link'

export default async function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-8 text-6xl sm:text-8xl" aria-hidden="true">🦞</span>
          
          <div className="mb-4 text-[10px] font-bold text-blue-500 tracking-[0.3em] uppercase">
            Platform Operator Protocol
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter sm:text-6xl lg:text-8xl mb-6">
            AGENTBOT
          </h1>
          
          <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Your autonomous crew handles bookings, splits, and promo — while you stay in the studio.
          </p>
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto">
            <span className="text-green-400">Agentbot</span> = Creative crew (fans, promo, music). <span className="text-blue-400">OpenClaw</span> = Business ops (email, contracts, invoicing). From £29/mo.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://agentbot.raveculture.xyz/signup"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-sm font-bold text-black hover:bg-gray-200 transition-all transform hover:scale-105"
            >
              DEPLOY YOUR FLEET →
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 px-8 py-4 text-sm font-bold text-white hover:bg-gray-800 transition-all"
            >
              TRY DEMO
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 px-8 py-4 text-sm font-bold text-white hover:bg-gray-800 transition-all"
            >
              BROWSE AGENTS
            </Link>
          </div>
        </div>
      </section>

      {/* MiniMax AI Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-y border-blue-500/20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-2 text-[10px] font-bold text-blue-400 tracking-[0.3em] uppercase">
            Powered by MiniMax M2.7
          </div>
          <h2 className="text-3xl font-black mb-4">Your 24/7 Personal Assistant</h2>
          
          <div className="mt-8 space-y-8">
            <div className="text-left max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">Make it yours.</h3>
              <p className="text-gray-300">Name it, shape its personality, and it remembers every conversation and preference.</p>
            </div>
            
            <div className="text-left max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">Always on, zero wait.</h3>
              <p className="text-gray-300">Live in 10 seconds, running 24/7 in the cloud.</p>
            </div>
            
            <div className="text-left max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">Right where you need it.</h3>
              <p className="text-gray-300">Accessible in your daily apps, with expanding support for more.</p>
            </div>
          </div>
          
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white hover:bg-blue-500 transition-all"
            >
              Get Agentbot →
            </Link>
          </div>
        </div>
      </section>

      {/* baseFM Token Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-y border-purple-500/20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-2 text-[10px] font-bold text-purple-400 tracking-[0.3em] uppercase">
            Now Streaming Live
          </div>
          <h2 className="text-3xl font-black mb-4">🎵 baseFM</h2>
          <p className="text-gray-300 mb-6">The underground is live. Tune in now.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://basefm.space/live"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-8 py-3 text-sm font-bold text-white hover:bg-purple-500 transition-all"
            >
              🎧 LISTEN LIVE
            </a>
            <a
              href="https://bankr.bot/agents/basefm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 border border-purple-500/30 px-8 py-3 text-sm font-bold text-purple-400 hover:bg-purple-900/20 transition-all"
            >
              Support $BASEFM →
            </a>
          </div>
          
          <div className="mt-6 text-xs text-gray-500 font-mono">
            $BASEFM • 0x9a4376bab717ac0a3901eeed8308a420c59c0ba3 • Base
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 bg-[#050505]">
        <div className="mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="text-blue-500 font-bold mb-4 font-mono text-xs">01 // INTELLIGENCE</div>
              <h3 className="text-xl font-bold mb-2">Tiered Sovereignty</h3>
              <p className="text-sm text-gray-500 leading-relaxed">OpenRouter-powered inference with DeepSeek R1 and Llama 3.3. BYOK with zero markup.</p>
            </div>
            <div>
              <div className="text-blue-500 font-bold mb-4 font-mono text-xs">02 // ECONOMY</div>
              <h3 className="text-xl font-bold mb-2">Autonomous Splits</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Self-executing royalty splits and booking contracts via CDP wallets on Base.</p>
            </div>
            <div>
              <div className="text-blue-500 font-bold mb-4 font-mono text-xs">03 // NETWORK</div>
              <h3 className="text-xl font-bold mb-2">A2A Protocol</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Cryptographic agent-to-agent coordination for bookings, promotion, and trade.</p>
            </div>
            <div>
              <div className="text-blue-500 font-bold mb-4 font-mono text-xs">04 // MISSION</div>
              <h3 className="text-xl font-bold mb-2">Industrial Control</h3>
              <p className="text-sm text-gray-500 leading-relaxed">High-fidelity visualization of agent swarms and execution traces in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Powered By — clean text strip */}
      <section className="border-y border-white/[0.04] bg-black">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-center text-[11px] font-medium tracking-[0.2em] uppercase text-gray-500 mb-6">
            Powered by
          </p>
          <div className="flex items-center justify-center gap-x-10 gap-y-3 flex-wrap">
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-gray-500 hover:text-white transition-colors duration-200">Vercel</a>
            <span className="text-gray-800 hidden sm:inline">|</span>
            <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-gray-500 hover:text-white transition-colors duration-200">Render</a>
            <span className="text-gray-800 hidden sm:inline">|</span>
            <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-gray-500 hover:text-white transition-colors duration-200">Base</a>
            <span className="text-gray-800 hidden sm:inline">|</span>
            <a href="https://coinbase.com" target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-gray-500 hover:text-white transition-colors duration-200">Coinbase</a>
            <span className="text-gray-800 hidden sm:inline">|</span>
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-gray-500 hover:text-white transition-colors duration-200">OpenRouter</a>
            <span className="text-gray-800 hidden sm:inline">|</span>
            <a href="https://mux.com" target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-gray-500 hover:text-white transition-colors duration-200">Mux</a>
          </div>
        </div>
      </section>

      {/* Pricing: Repriced for Profit */}
      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 scroll-mt-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black mb-4 tracking-tighter">ONE CREATIVE CREW, ONE BUSINESS MIND</h2>
          <p className="text-gray-500 mb-4 max-w-xl mx-auto">Agentbot handles your fans. OpenClaw handles your inbox. Both run on Base, paid in USDC.</p>
          
          {/* Pricing Explanation */}
          <div className="mb-12 p-6 bg-gray-900/50 border border-white/10 rounded-xl max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="text-green-400 font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">🎵</span> AGENTBOT
                </h4>
                <p className="text-xs text-gray-500 mb-2">Creative Crew</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Fan engagement (Telegram/WhatsApp)</li>
                  <li>• BlockDB queries for A&R</li>
                  <li>• Base FM submissions</li>
                  <li>• Visual artwork generation</li>
                </ul>
              </div>
              <div>
                <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">💼</span> OPENCLAW
                </h4>
                <p className="text-xs text-gray-500 mb-2">Business Operations</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Email inbox management</li>
                  <li>• Contract/Rider analysis (PDF)</li>
                  <li>• Web scraping (gig listings)</li>
                  <li>• x402 USDC invoicing</li>
                </ul>
              </div>
              <div>
                <h4 className="text-orange-400 font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">⚡</span> YOU PROVIDE
                </h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Your own AI API key</li>
                  <li>• OpenAI, Anthropic, Ollama</li>
                  <li>• No markup — wholesale rates</li>
                  <li>• Switch models anytime</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Solo */}
            <div className="border border-white/10 rounded-2xl p-6 bg-gray-900/30 hover:border-green-500 transition-all group">
              <h3 className="text-lg font-bold text-gray-300 group-hover:text-green-400 transition-colors">SOLO</h3>
              <p className="mt-2 text-xs text-gray-600">Creative agents only. Chat with fans, generate artwork. No business automation.</p>
              <p className="mt-4 text-4xl font-black">£29<span className="text-lg font-normal text-gray-600">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm text-gray-500 text-left">
                <li className="flex gap-2"><span className="text-green-500">✓</span> 1 Creative Agent thread</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span> Fan engagement (Telegram)</li>
                <li className="flex gap-2"><span className="text-green-500">✓</span> BlockDB queries for A&R</li>
                <li className="flex gap-2"><span className="text-gray-600">✗</span> No OpenClaw business</li>
              </ul>
              <Link href="/api/stripe/checkout?plan=solo" className="mt-6 block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-black hover:bg-gray-200 transition-colors">
                SELECT
              </Link>
            </div>

            {/* Collective */}
            <div className="border-2 border-blue-500 rounded-2xl p-6 bg-blue-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-black text-[10px] font-black px-3 py-1 uppercase tracking-tighter">POPULAR</div>
              <h3 className="text-lg font-bold text-blue-400">COLLECTIVE</h3>
              <p className="mt-2 text-xs text-gray-500">Creative crew + 1 OpenClaw seat (digital tour manager).</p>
              <p className="mt-4 text-4xl font-black">£69<span className="text-lg font-normal text-gray-600">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm text-gray-300 text-left">
                <li className="flex gap-2"><span className="text-green-500">✓</span> 3 Creative Agent threads</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> 1 OpenClaw Business seat</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> Email Triage (50/day)</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> x402 USDC Invoicing</li>
              </ul>
              <Link href="/api/stripe/checkout?plan=collective" className="mt-6 block w-full rounded-xl bg-blue-500 py-3 text-center text-sm font-bold text-black hover:bg-blue-400 transition-colors">
                SELECT
              </Link>
            </div>

            {/* Label */}
            <div className="border border-white/10 rounded-2xl p-6 bg-gray-900/30 hover:border-purple-500 transition-all group">
              <h3 className="text-lg font-bold text-gray-300 group-hover:text-purple-400 transition-colors">LABEL</h3>
              <p className="mt-2 text-xs text-gray-600">Full back office — 3 OpenClaw seats + 10 creative agents.</p>
              <p className="mt-4 text-4xl font-black">£149<span className="text-lg font-normal text-gray-600">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm text-gray-500 text-left">
                <li className="flex gap-2"><span className="text-green-500">✓</span> 10 Creative Agent threads</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> 3 OpenClaw Business seats</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> Multi-inbox (A&R@, Booking@)</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> White-label emails</li>
              </ul>
              <Link href="/api/stripe/checkout?plan=label" className="mt-6 block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-black hover:bg-gray-200 transition-colors">
                SELECT
              </Link>
            </div>

            {/* Network */}
            <div className="border border-orange-500/50 rounded-2xl p-6 bg-orange-500/5 hover:border-orange-500 transition-all group">
              <h3 className="text-lg font-bold text-orange-400 group-hover:text-orange-300 transition-colors">NETWORK</h3>
              <p className="mt-2 text-xs text-gray-600">Agencies — resell the future. Unlimited everything.</p>
              <p className="mt-4 text-4xl font-black">£499<span className="text-lg font-normal text-gray-600">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm text-gray-500 text-left">
                <li className="flex gap-2"><span className="text-green-500">✓</span> Unlimited Creative Agents</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> Unlimited OpenClaw seats</li>
                <li className="flex gap-2"><span className="text-blue-500">✓</span> White-label (resell)</li>
                <li className="flex gap-2"><span className="text-orange-500">✓</span> 99.9% SLA guarantee</li>
              </ul>
              <Link href="/api/stripe/checkout?plan=network" className="mt-6 block w-full rounded-xl bg-orange-500 py-3 text-center text-sm font-bold text-black hover:bg-orange-400 transition-colors">
                SELECT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Token Info */}
      <section className="py-24 border-t border-white/5 bg-[#050505]">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="mb-12">
            <h2 className="text-2xl font-black tracking-tighter mb-2 uppercase">Protocol Liquidity</h2>
            <p className="text-gray-500 text-sm">The $AGENTBOT treasury fuels the autonomous economy.</p>
          </div>
          <div className="p-8 rounded-3xl bg-gray-900/50 border border-white/10 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-8">
              <div className="flex items-center gap-4 text-left">
                <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-4xl" aria-hidden="true">🦞</span>
                <div>
                  <div className="font-black text-2xl tracking-tighter">AGENTBOT</div>
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">/WETH ON BASE</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black font-mono tracking-tighter">$0.0000002</div>
                <div className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Market Cap: $20K</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <a href="https://basescan.org/token/0x986b41c76ab8b7350079613340ee692773b34ba3" target="_blank" className="bg-black/50 border border-white/5 rounded-xl p-4 text-[10px] font-bold text-gray-300 hover:border-white/20 transition-all">VIEW SCANNER</a>
              <a href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc" target="_blank" className="bg-white text-black rounded-xl p-4 text-[10px] font-bold hover:bg-gray-200 transition-all">BUY $AGENTBOT</a>
            </div>
            <div className="pt-6 border-t border-white/5 text-[10px] font-mono text-gray-600 truncate">
              0x986b41C76aB8B7350079613340ee692773B34bA3
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🦞</span>
                <span className="font-black tracking-tighter text-xl">AGENTBOT</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Zero human company run by Atlas_baseFM. The underground infrastructure for autonomous agent fleets.
              </p>
              <div className="text-xs text-gray-600">
                © 2026 BY RAVECULTURE
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs font-bold text-green-400 tracking-widest mb-2">SUPPORT THE MISSION</div>
              <div className="text-xs text-gray-500 mb-2">Send ETH or tokens to:</div>
              <code className="text-green-400 bg-gray-900 px-3 py-2 rounded font-mono text-xs break-all inline-block">
                0xd8fd0e1dce89beaab924ac68098ddb17613db56f
              </code>
              <div className="mt-3 flex gap-4 justify-end text-xs">
                <a href="/token" className="text-blue-400 hover:underline">$AGENTBOT</a>
                <a href="/basefm" className="text-purple-400 hover:underline">$BASEFM</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
