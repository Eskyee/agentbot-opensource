import Link from 'next/link'
import { getPublicPricing } from './lib/stripe-pricing'

export const revalidate = 300

export default async function Home() {
  const pricing = await getPublicPricing()

  return (
    <main className="min-h-screen">
      {/* Launch Banner */}
      <div className="bg-gradient-to-r from-white/10 to-gray-500/10 border-b border-white/20">
        <div className="mx-auto max-w-4xl text-center py-3 px-4">
          <span className="text-sm">
            🚀 <strong>Launching Soon</strong> — Sign up now for early access and launch pricing!
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 text-6xl sm:text-8xl">🦞</div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Deploy AI Agents in 60 Seconds
          </h1>
          
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Your own AI agent running on secure cloud infrastructure. 
            Chat via Telegram, Discord, or WhatsApp.
          </p>
          
          <p className="mt-2 text-sm text-gray-500">
            No spam, ever
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm hover:bg-gray-200 transition-colors"
            >
              Deploy Agent
            </Link>
            <Link
              href="/docs"
              className="rounded-md bg-black border border-gray-800 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-colors"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-center mb-16">Everything you need</h2>
          
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-lg font-medium mb-2">One-Click Deploy</h3>
              <p className="text-sm text-gray-400">Launch your agent in under a minute. No configuration needed.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2">Secure by Default</h3>
              <p className="text-sm text-gray-400">Your data stays yours. Bring your own API keys.</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">Multi-Channel</h3>
              <p className="text-sm text-gray-400">Connect to Telegram, Discord, WhatsApp, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-900">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-center text-gray-400 mb-12">Start free, upgrade when you need more.</p>
          
          {/* Token Info */}
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl">🦞</div>
                <div>
                  <div className="font-bold text-lg">AGENTBOT</div>
                  <div className="text-sm text-gray-400">/WETH on Base</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$0.0000002</div>
                <div className="text-xs text-gray-400">Market Cap: $20K</div>
              </div>
              <a 
                href="https://www.geckoterminal.com/base/pools/0xfe7d38e7d9357e61da8fcbd12484dae3609899e6449f84a2ef78625e5e9ec2fc"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Buy AGENTBOT →
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>🔗</span>
              Builder Code: <span className="font-mono text-white">bc_upjlm3yl</span>
              <span className="text-xs text-gray-500">on Base</span>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Free */}
            <div className="border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium">Free</h3>
              <p className="mt-2 text-3xl font-bold">£0</p>
              <p className="text-sm text-gray-400 mt-1">3-day trial</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-400">
                <li>Full platform access</li>
                <li>Telegram integration</li>
                <li>Community support</li>
              </ul>
              <a href="/api/stripe/checkout?plan=trial" className="mt-6 block w-full rounded-md border border-gray-700 py-2 text-center text-sm font-medium hover:bg-gray-900 transition-colors">
                Try Free
              </a>
            </div>
            
            {/* Starter */}
            <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
              <h3 className="text-lg font-medium">Starter</h3>
              <p className="mt-2 text-3xl font-bold">£9<span className="text-lg font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mt-1">per user</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-400">
                <li>Everything in Free</li>
                <li>Bring your own API key</li>
                <li>Priority support</li>
              </ul>
              <a href="/api/stripe/checkout?plan=starter" className="mt-6 block w-full rounded-md bg-white py-2 text-center text-sm font-medium text-black hover:bg-gray-200 transition-colors">
                Get Started
              </a>
            </div>
            
            {/* Pro */}
            <div className="border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium">Pro</h3>
              <p className="mt-2 text-3xl font-bold">£29<span className="text-lg font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mt-1">per user</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-400">
                <li>3x resources</li>
                <li>Custom domain</li>
                <li>WhatsApp support</li>
              </ul>
              <a href="/api/stripe/checkout?plan=pro" className="mt-6 block w-full rounded-md border border-gray-700 py-2 text-center text-sm font-medium hover:bg-gray-900 transition-colors">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-gray-900">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold">Ready to deploy?</h2>
          <p className="mt-4 text-gray-400">Start building your AI agent in minutes.</p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm hover:bg-gray-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section id="contact" className="py-20 border-t border-gray-800">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold">Contact Sales</h2>
          <p className="mt-4 text-gray-400">Need custom infrastructure or volume discounts?</p>
          <a
            href="mailto:info@agentbot.com"
            className="mt-8 inline-block rounded-md border border-gray-700 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Email Us
          </a>
        </div>
      </section>
    </main>
  )
}
