import Link from 'next/link'

export default function Home() {

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 text-6xl sm:text-8xl" role="img" aria-label="Lobster emoji">🦞</div>
          
          <div className="mb-4 text-sm font-medium text-gray-7 tracking-wide">
            AGENTBOT OPENCLAW
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Deploy OpenClaw in Seconds
          </h1>
          
          <p className="mt-6 text-lg text-gray-7 max-w-2xl mx-auto">
            OpenClaw is an AI assistant with personality and memory. Agentbot deploys it to the cloud for you in one click—no complex setup, online 24/7.
          </p>
          
          <p className="mt-4 text-base text-gray-6 max-w-2xl mx-auto">
            Chat freely through Agentbot. Configured with Kimi K2.5 Thinking and ready-to-use skills; runs across multiple messaging apps and gets tasks done proactively.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_1px_0_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.12)] hover:bg-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              Get Started →
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg bg-gray-1 border border-gray-4 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-2 hover:border-gray-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 transition-colors"
            >
              Read the Docs
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/signup?mode=link" className="text-gray-6 hover:text-white transition-colors">
              Link existing OpenClaw →
            </Link>
            <span className="text-gray-8">·</span>
            <Link href="/signup?mode=create" className="text-gray-6 hover:text-white transition-colors">
              Create Agentbot →
            </Link>
            <span className="text-gray-8">·</span>
            <Link href="/signup?mode=deploy" className="text-gray-6 hover:text-white transition-colors">
              Deploy OpenClaw with one click →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-2">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-center mb-4">Why Agentbot?</h2>
          <p className="text-center text-gray-6 mb-16 max-w-2xl mx-auto">
            Deploy OpenClaw with personality, memory, and skills—ready to work across all your messaging apps
          </p>
          
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Brain">🧠</div>
              <h3 className="text-lg font-medium mb-2">Kimi K2.5 Thinking</h3>
              <p className="text-sm text-gray-7">128K context remembers your whole vibe. Thinks like a selector—analyzes patterns and suggests what's next.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Tools">🔧</div>
              <h3 className="text-lg font-medium mb-2">Ready-to-Use Skills</h3>
              <p className="text-sm text-gray-7">Pre-built capabilities for data, web, and automation tasks.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Chat">💬</div>
              <h3 className="text-lg font-medium mb-2">Multi-Channel</h3>
              <p className="text-sm text-gray-7">Telegram, Discord, WhatsApp. One agent, everywhere.</p>
            </div>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Memory">💾</div>
              <h3 className="text-lg font-medium mb-2">Persistent Memory</h3>
              <p className="text-sm text-gray-7">Your agent remembers every conversation, every preference—months of context at its fingertips.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Badge">✓</div>
              <h3 className="text-lg font-medium mb-2">Verified Human Badge</h3>
              <p className="text-sm text-gray-7">Onchain attestation proves a real person runs this agent. Trust matters in crypto.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Cloud">☁️</div>
              <h3 className="text-lg font-medium mb-2">Always Online</h3>
              <p className="text-sm text-gray-7">Cloud-hosted, 24/7 availability. No server management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-2">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">Built for Trust</h2>
            <p className="text-gray-6 max-w-2xl mx-auto">
              In crypto and underground scenes, reputation is everything. Agentbot agents show who's really behind them.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="border border-gray-4 rounded-xl p-6 bg-gray-1">
              <div className="text-2xl mb-3">🔐</div>
              <h3 className="text-lg font-medium mb-2">Onchain Verification</h3>
              <p className="text-sm text-gray-7">Link your agent to Coinbase Verify, ENS, or other attestations. Prove you're real.</p>
            </div>
            
            <div className="border border-gray-4 rounded-xl p-6 bg-gray-1">
              <div className="text-2xl mb-3">👤</div>
              <h3 className="text-lg font-medium mb-2">Human Reputation</h3>
              <p className="text-sm text-gray-7">Your agent shows "Verified by [you]" in every chat. Reputation tied to the human, not the bot.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-2 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-7 mb-12">Simple, Transparent Pricing</p>
          
          <div className="grid sm:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {/* Starter */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
              <h3 className="text-lg font-medium">Starter</h3>
              <p className="text-sm text-gray-5 mt-1">Perfect for individuals</p>
              <p className="mt-2 text-3xl font-bold">£19<span className="text-lg font-normal text-gray-7">/mo</span></p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7 flex-grow">
                <li>✓ 1 AI Agent</li>
                <li>✓ 2GB RAM, 1 CPU</li>
                <li>✓ 10GB storage</li>
                <li>✓ Telegram channel</li>
                <li>✓ Use your own AI key</li>
              </ul>
              <a href="/signup" className="mt-6 block w-full rounded-lg bg-white py-2.5 text-center text-sm font-medium text-black shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_1px_0_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.12)] hover:bg-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
                Get Started
              </a>
            </div>
            
            {/* Pro */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
              <h3 className="text-lg font-medium">Pro</h3>
              <p className="text-sm text-gray-5 mt-1">For power users</p>
              <p className="mt-2 text-3xl font-bold">£39<span className="text-lg font-normal text-gray-7">/mo + usage</span></p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7 flex-grow">
                <li>✓ 1 AI Agent</li>
                <li>✓ 4GB RAM, 2 CPU</li>
                <li>✓ 50GB storage</li>
                <li>✓ Telegram + WhatsApp</li>
                <li>✓ Custom domain</li>
              </ul>
              <a href="/signup" className="mt-6 block w-full rounded-lg bg-white py-2.5 text-center text-sm font-medium text-black shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_1px_0_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.12)] hover:bg-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
                Get Started
              </a>
            </div>
            
            {/* Scale */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
              <h3 className="text-lg font-medium">Scale</h3>
              <p className="text-sm text-gray-5 mt-1">For growing teams</p>
              <p className="mt-2 text-3xl font-bold">£79<span className="text-lg font-normal text-gray-7">/mo</span></p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7 flex-grow">
                <li>✓ 3 AI Agents</li>
                <li>✓ 8GB RAM, 4 CPU</li>
                <li>✓ 100GB storage</li>
                <li>✓ All channels</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <a href="/signup" className="mt-6 block w-full rounded-lg border border-gray-5 py-2.5 text-center text-sm font-medium hover:bg-gray-2 hover:border-gray-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 transition-colors">
                Get Started
              </a>
            </div>
            
            {/* Enterprise */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
              <h3 className="text-lg font-medium">Enterprise</h3>
              <p className="text-sm text-gray-5 mt-1">Full service solution</p>
              <p className="mt-2 text-3xl font-bold">£149<span className="text-lg font-normal text-gray-7">/mo</span></p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7 flex-grow">
                <li>✓ Unlimited agents</li>
                <li>✓ 16GB RAM, 4 CPU</li>
                <li>✓ 500GB storage</li>
                <li>✓ White-label options</li>
                <li>✓ 24/7 phone support</li>
              </ul>
              <a href="/signup" className="mt-6 block w-full rounded-lg border border-gray-5 py-2.5 text-center text-sm font-medium hover:bg-gray-2 hover:border-gray-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 transition-colors">
                Get Started
              </a>
            </div>
            
            {/* White Glove */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)] flex flex-col">
              <h3 className="text-lg font-medium">White Glove</h3>
              <p className="text-sm text-gray-5 mt-1">Premium solution</p>
              <p className="mt-2 text-3xl font-bold">£199<span className="text-lg font-normal text-gray-7">/mo</span></p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7 flex-grow">
                <li>Everything in Enterprise</li>
                <li>10x resources</li>
                <li>Dedicated account manager</li>
                <li>Priority 24/7 support</li>
                <li>Custom SLA</li>
              </ul>
              <a href="/signup" className="mt-6 block w-full rounded-lg border border-gray-5 py-2.5 text-center text-sm font-medium hover:bg-gray-2 hover:border-gray-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 transition-colors">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-2">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold">Ready to Deploy?</h2>
          <p className="mt-4 text-gray-7">Start building your AI agent in minutes.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_1px_0_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.12)] hover:bg-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section id="contact" className="py-20 border-t border-gray-2 scroll-mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold">Contact Sales</h2>
          <p className="mt-4 text-gray-7">Need custom infrastructure or volume discounts?</p>
          <a
            href="mailto:rbasefm@icloud.com"
            className="mt-8 inline-flex items-center justify-center rounded-lg border border-gray-5 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-2 hover:border-gray-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 transition-colors"
          >
            Email Us
          </a>
        </div>
      </section>

      {/* Token Info */}
      <section className="py-20 border-t border-gray-2">
        <div className="mx-auto max-w-2xl px-4">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-1 to-gray-2 border border-gray-4 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_16px_rgba(0,0,0,0.15)]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl" role="img" aria-label="Lobster">🦞</div>
                <div>
                  <div className="font-bold text-lg">AGENTBOT</div>
                  <div className="text-sm text-gray-7">/WETH on Base</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono">$0.0000002</div>
                <div className="text-xs text-gray-7">Market Cap: $20K</div>
              </div>
              <a 
                href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                Buy AGENTBOT →
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-4 space-y-3">
              <div className="flex items-center justify-center gap-3 text-sm">
                <a 
                  href="https://basescan.org/token/0x986b41c76ab8b7350079613340ee692773b34ba3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  View on BaseScan →
                </a>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-6">
                <span>Contract:</span>
                <code className="font-mono text-gray-7 bg-gray-2 px-2 py-1 rounded">0x986b41C76aB8B7350079613340ee692773B34bA3</code>
              </div>
              <div className="flex items-center justify-center pt-2">
                <a 
                  href="https://www.geckoterminal.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-6 hover:text-gray-7 transition-colors"
                >
                  <span>Powered by</span>
                  <span className="font-semibold">GeckoTerminal</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-2 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦞</span>
                <span className="font-bold">Agentbot</span>
                <span className="text-gray-6 text-sm">© 2026</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-6">
                <span>Builder Code:</span>
                <span className="font-mono text-gray-7">bc_upjlm3yl</span>
                <span className="text-gray-6">on Base</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <a 
                href="https://x.com/Esky33junglist" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-6 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              <a 
                href="https://github.com/Eskyee" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-6 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
              </a>
              
              <a 
                href="https://t.me/esky33" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-6 hover:text-white transition-colors"
                aria-label="Telegram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
              
              <a 
                href="https://discord.com/users/eskyee" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-6 hover:text-white transition-colors"
                aria-label="Discord"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
