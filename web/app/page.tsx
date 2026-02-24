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
            AI Agents That Actually Work
          </h1>
          
          <p className="mt-6 text-lg text-gray-7 max-w-2xl mx-auto">
            Launch your AI employee in under a minute. Secure cloud infrastructure included. 
            Chat via Telegram, Discord, or WhatsApp.
          </p>
          
          <p className="mt-2 text-sm text-gray-6">
            Start building. Stop managing servers.
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
          <h2 className="text-2xl font-semibold text-center mb-16">Everything You Need</h2>
          
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Rocket">🚀</div>
              <h3 className="text-lg font-medium mb-2">One-Click Deploy</h3>
              <p className="text-sm text-gray-7">Launch your agent in under a minute. No configuration needed.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Lock">🔒</div>
              <h3 className="text-lg font-medium mb-2">Secure by Default</h3>
              <p className="text-sm text-gray-7">Your data stays yours. Bring your own API keys.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4" role="img" aria-label="Chat">💬</div>
              <h3 className="text-lg font-medium mb-2">Multi-Channel</h3>
              <p className="text-sm text-gray-7">Connect to Telegram, Discord, WhatsApp & more.</p>
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
            <div className="mt-4 pt-4 border-t border-gray-4 flex items-center justify-center gap-2 text-sm text-gray-7">
              <span role="img" aria-label="Link">🔗</span>
              Builder Code: <span className="font-mono text-white">bc_upjlm3yl</span>
              <span className="text-xs text-gray-6">on Base</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
