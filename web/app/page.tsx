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
              href="/onboard"
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
            <Link href="/onboard?mode=link" className="text-gray-6 hover:text-white transition-colors">
              Link existing OpenClaw →
            </Link>
            <span className="text-gray-8">·</span>
            <Link href="/onboard?mode=create" className="text-gray-6 hover:text-white transition-colors">
              Create Agentbot →
            </Link>
            <span className="text-gray-8">·</span>
            <Link href="/onboard?mode=deploy" className="text-gray-6 hover:text-white transition-colors">
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
              <p className="text-sm text-gray-7">Advanced reasoning with 128K context. Configured and ready to use.</p>
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
              <p className="text-sm text-gray-7">Remembers conversations and preferences across sessions.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Clock">⏰</div>
              <h3 className="text-lg font-medium mb-2">Proactive Tasks</h3>
              <p className="text-sm text-gray-7">Schedule tasks and get things done automatically.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Cloud">☁️</div>
              <h3 className="text-lg font-medium mb-2">Always Online</h3>
              <p className="text-sm text-gray-7">Cloud-hosted, 24/7 availability. No server management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-2 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-7 mb-12">Start free, upgrade when you need more.</p>
          
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Free */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-1 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-medium">Free</h3>
              <p className="mt-2 text-3xl font-bold">£0</p>
              <p className="text-sm text-gray-7 mt-1">3-day trial</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7">
                <li>Full platform access</li>
                <li>Telegram integration</li>
                <li>Community support</li>
              </ul>
              <a href="/api/stripe/checkout?plan=trial" className="mt-6 block w-full rounded-lg border border-gray-5 py-2.5 text-center text-sm font-medium hover:bg-gray-2 hover:border-gray-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 transition-colors">
                Try Free
              </a>
            </div>
            
            {/* Starter */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-2 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-medium">Starter</h3>
              <p className="mt-2 text-3xl font-bold">£9<span className="text-lg font-normal text-gray-7">/mo</span></p>
              <p className="text-sm text-gray-7 mt-1">per user</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7">
                <li>Everything in Free</li>
                <li>Bring your own API key</li>
                <li>Priority support</li>
              </ul>
              <a href="/api/stripe/checkout?plan=starter" className="mt-6 block w-full rounded-lg bg-white py-2.5 text-center text-sm font-medium text-black shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_1px_0_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.12)] hover:bg-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
                Get Started
              </a>
            </div>
            
            {/* Pro */}
            <div className="border border-gray-4 rounded-lg p-6 bg-gray-1 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="text-lg font-medium">Pro</h3>
              <p className="mt-2 text-3xl font-bold">£29<span className="text-lg font-normal text-gray-7">/mo</span></p>
              <p className="text-sm text-gray-7 mt-1">per user</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-7">
                <li>3× resources</li>
                <li>Custom domain</li>
                <li>WhatsApp support</li>
              </ul>
              <a href="/api/stripe/checkout?plan=pro" className="mt-6 block w-full rounded-lg border border-gray-5 py-2.5 text-center text-sm font-medium hover:bg-gray-2 hover:border-gray-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-7 transition-colors">
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
            <div className="mt-4 pt-4 border-t border-gray-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-7">
              <div className="flex items-center gap-2">
                <span role="img" aria-label="Link">🔗</span>
                Builder Code: <span className="font-mono text-white">bc_upjlm3yl</span>
                <span className="text-xs text-gray-6">on Base</span>
              </div>
              <span className="hidden sm:inline text-gray-6">·</span>
              <a 
                href="https://basescan.org/token/0xYOUR_CONTRACT_ADDRESS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                View on BaseScan →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
