import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import PartnerLogos from './components/PartnerLogos'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 text-6xl sm:text-8xl" role="img" aria-label="Lobster emoji">🦞</div>
          
          <div className="mb-4 text-[10px] font-bold text-blue-500 tracking-[0.3em] uppercase">
            Platform Operator Protocol
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter sm:text-6xl lg:text-8xl mb-6">
            AGENTBOT
          </h1>
          
          <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The multi-tenant orchestration layer for high-performance agent fleets. 
            Sovereign, autonomous, and tuned for the underground.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-sm font-bold text-black hover:bg-gray-200 transition-all transform hover:scale-105"
              >
                ENTER MISSION CONTROL →
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-sm font-bold text-black hover:bg-gray-200 transition-all transform hover:scale-105"
              >
                DEPLOY YOUR FLEET →
              </Link>
            )}
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 px-8 py-4 text-sm font-bold text-white hover:bg-gray-800 transition-all"
            >
              BROWSE AGENTS
            </Link>
          </div>

          <PartnerLogos />
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 bg-[#050505]">
        <div className="mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="text-blue-500 font-bold mb-4 font-mono text-xs">01 // INTELLIGENCE</div>
              <h3 className="text-xl font-bold mb-2">Tiered Sovereignty</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Local Ollama inference with DeepSeek R1 and Llama 3.3. No external API tax. 100% margin.</p>
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

      {/* Pricing: Repriced for Profit */}
      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-white/5 scroll-mt-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black mb-4 tracking-tighter">FLEET SUBSCRIPTIONS</h2>
          <p className="text-gray-500 mb-16 max-w-xl mx-auto">Scalable infrastructure for soundsystem crews and digital labels.</p>
          
          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Underground */}
            <div className="border border-white/10 rounded-2xl p-8 bg-gray-900/50 hover:border-blue-500 transition-all group">
              <h3 className="text-lg font-bold text-gray-400 group-hover:text-blue-400 transition-colors">UNDERGROUND</h3>
              <p className="mt-4 text-5xl font-black">£29<span className="text-lg font-normal text-gray-600">/mo</span></p>
              <ul className="mt-8 space-y-4 text-sm text-gray-400 text-left">
                <li className="flex gap-3"><span>✓</span> 1 High-Speed Agent</li>
                <li className="flex gap-3"><span>✓</span> Mistral 7B (Free Tier)</li>
                <li className="flex gap-3"><span>✓</span> A2A Bus Access</li>
                <li className="flex gap-3"><span>✓</span> Basic Analytics</li>
              </ul>
              <Link href="/signup?plan=underground" className="mt-8 block w-full rounded-xl bg-white py-4 text-center text-sm font-bold text-black hover:bg-gray-200 transition-colors">
                CHOOSE UNDERGROUND
              </Link>
            </div>
            
            {/* Collective */}
            <div className="border-2 border-blue-500 rounded-2xl p-8 bg-blue-500/5 relative overflow-hidden transform scale-105">
              <div className="absolute top-0 right-0 bg-blue-500 text-black text-[10px] font-black px-4 py-1 uppercase tracking-tighter">RECOMMENDED</div>
              <h3 className="text-lg font-bold text-blue-400">COLLECTIVE</h3>
              <p className="mt-4 text-5xl font-black">£69<span className="text-lg font-normal text-gray-600">/mo</span></p>
              <ul className="mt-8 space-y-4 text-sm text-gray-300 text-left">
                <li className="flex gap-3"><span>✓</span> 3 Autonomous Agents</li>
                <li className="flex gap-3"><span>✓</span> Llama 3.3 Optimized</li>
                <li className="flex gap-3"><span>✓</span> Royalty Split Engine</li>
                <li className="flex gap-3"><span>✓</span> Mission Control Graph</li>
              </ul>
              <Link href="/signup?plan=collective" className="mt-8 block w-full rounded-xl bg-blue-500 py-4 text-center text-sm font-bold text-black hover:bg-blue-400 transition-colors">
                CHOOSE COLLECTIVE
              </Link>
            </div>
            
            {/* Label */}
            <div className="border border-white/10 rounded-2xl p-8 bg-gray-900/50 hover:border-purple-500 transition-all group">
              <h3 className="text-lg font-bold text-gray-400 group-hover:text-purple-400 transition-colors">LABEL</h3>
              <p className="mt-4 text-5xl font-black">£199<span className="text-lg font-normal text-gray-600">/mo</span></p>
              <ul className="mt-8 space-y-4 text-sm text-gray-400 text-left">
                <li className="flex gap-3"><span>✓</span> Unlimited Agents</li>
                <li className="flex gap-3"><span>✓</span> DeepSeek R1 Reasoning</li>
                <li className="flex gap-3"><span>✓</span> Priority A2A Routing</li>
                <li className="flex gap-3"><span>✓</span> White-Glove Staging</li>
              </ul>
              <Link href="/signup?plan=label" className="mt-8 block w-full rounded-xl bg-white py-4 text-center text-sm font-bold text-black hover:bg-gray-200 transition-colors">
                CHOOSE LABEL
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
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-4xl" role="img" aria-label="Lobster">🦞</div>
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
              <a href="https://basescan.org/token/0x986b41c76ab8b7350079613340ee692773b34ba3" target="_blank" className="bg-black/50 border border-white/5 rounded-xl p-4 text-[10px] font-bold text-gray-400 hover:border-white/20 transition-all">VIEW SCANNER</a>
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
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦞</span>
              <span className="font-black tracking-tighter text-xl">AGENTBOT</span>
              <span className="text-gray-600 text-xs">© 2026 BY RAVECULTURE</span>
            </div>
            
            <div className="flex items-center gap-12 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-bold tracking-widest text-blue-500 uppercase">Deployed on</span>
                <span className="font-black text-sm tracking-tight">VERCEL</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-bold tracking-widest text-blue-500 uppercase">Hosted on</span>
                <span className="font-black text-sm tracking-tight">RENDER</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-bold tracking-widest text-blue-500 uppercase">Onchain via</span>
                <span className="font-black text-sm tracking-tight">BASE</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
