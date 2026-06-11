import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bankr Wallet — AI-Powered Crypto Wallet for Agentbot',
  description: 'Connect your Bankr wallet to Agentbot. Multi-chain balances, natural language trades, x402 payments. Base, Ethereum, Polygon, Solana.',
}

export default function BankrPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden pt-14">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Powered by Bankr
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              Multi-Chain
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Your AI agent<br />
            <span className="text-orange-500">trades for you.</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Connect your Bankr wallet and let your agent check balances, execute swaps,
            and manage your portfolio across Base, Ethereum, Polygon, Solana, and Unichain.
            Natural language. Your keys. Your funds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Connect Bankr Key
            </Link>
            <a
              href="https://bankr.bot/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-zinc-800 px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Get API Key →
            </a>
          </div>
        </div>
      </section>

      {/* What Your Agent Can Do */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">What Your Agent Can Do</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {[
              { label: 'Check Balances', body: '"What\'s my ETH balance on Base?" — instant multi-chain portfolio view.' },
              { label: 'Execute Trades', body: '"Buy $50 of ETH on Base" or "Swap 0.1 ETH for USDC" — natural language.' },
              { label: 'Track Portfolio', body: '"Show my portfolio" — holdings across all chains, real-time prices.' },
              { label: 'Set Alerts', body: '"Alert me if ETH drops below $2,000" — Telegram, Discord, or WhatsApp.' },
              { label: 'Manage DeFi', body: 'Track LP positions, yield farming, staking across Base and Ethereum.' },
              { label: 'Pay with x402', body: 'Use Bankr balance to pay for x402 services on Agentic Market.' },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.label}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Chains */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Supported Chains</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-zinc-900">
            {[
              { chain: 'Base', note: 'Recommended — low fees' },
              { chain: 'Ethereum', note: 'Mainnet' },
              { chain: 'Polygon', note: 'Low fees' },
              { chain: 'Solana', note: 'Fast finality' },
              { chain: 'Unichain', note: 'DeFi native' },
            ].map((item) => (
              <div key={item.chain} className="bg-black p-6 text-center">
                <div className="text-lg font-bold text-white">{item.chain}</div>
                <div className="text-[10px] text-zinc-600 mt-1">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Setup</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              { num: '01', title: 'Get Key', body: 'Sign up at bankr.bot/api. Generate an API key with agent access. Starts with bk_.' },
              { num: '02', title: 'Connect', body: 'Settings → Bankr Key → paste your key. We validate it against the Bankr API.' },
              { num: '03', title: 'Trade', body: 'Tell your agent what to do. "Buy ETH", "Check balance", "Swap USDC" — natural language.' },
            ].map((step) => (
              <div key={step.num} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4">{step.num}</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Security</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-6">
            Your keys. <span className="text-orange-500">Your funds.</span>
          </h2>
          <div className="space-y-4 text-zinc-400 text-sm max-w-lg leading-relaxed">
            <p>
              Your Bankr API key stays in your Agentbot settings. Agents only access YOUR wallet —
              not the platform's. Agentbot never touches your private keys.
            </p>
            <p>
              Start with read-only keys for research agents. Upgrade to read-write when you're
              ready to trade. Every trade requires your confirmation (approval queue).
            </p>
            <p>
              Bankr provisions wallets on each chain automatically. You control the keys.
              Transfer funds in and out at any time.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-20 sm:py-28 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase">
            Connect your<br />
            <span className="text-orange-500">Bankr wallet.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            AI-powered crypto trading. Multi-chain. Natural language. Your keys.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/settings"
              className="inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors w-full sm:w-auto"
            >
              Connect Bankr Key →
            </Link>
            <a
              href="https://bankr.bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-zinc-800 px-10 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors w-full sm:w-auto"
            >
              Learn More at Bankr
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 text-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-700">
            Agentbot · Powered by Bankr · Built on OpenClaw
          </span>
        </div>
      </footer>
    </main>
  )
}
