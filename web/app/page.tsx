import Link from 'next/link'
import { getPublicPricing } from './lib/stripe-pricing'

export const revalidate = 300

export default async function Home() {
  const pricing = await getPublicPricing()

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(249,115,22,0.12),transparent)]" />
        
        <div className="mx-auto max-w-4xl text-center">
          {/* Lobster emoji */}
          <div className="mb-6 text-5xl sm:text-7xl animate-float">🦞</div>
          
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl px-2">
            <span className="block">Deploy OpenClaw in 60 Seconds</span>
          </h1>
          
          <p className="mt-4 text-base text-gray-400 sm:text-lg leading-relaxed px-4">
            Deploy your AI agent in under 2 minutes.<br className="hidden sm:inline" />
            Chat via Telegram, Discord, or WhatsApp.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Credits included — no API keys needed
          </p>
          
          <div className="mt-8 px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-full bg-gray-900 px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-gray-700 transition-all text-center"
            >
              Deploy Agent
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto rounded-full bg-gray-800 px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white hover:bg-gray-700 transition-all text-center"
            >
              Docs
            </Link>
            <Link 
              href="#how-it-works" 
              className="w-full sm:w-auto rounded-full border border-gray-700 px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-300 hover:text-white hover:border-lobster-500 transition-all text-center"
            >
                Watch Demo
            </Link>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 px-2">
            <span className="rounded-full border border-gray-700 px-2 py-1">You control your keys</span>
            <span className="rounded-full border border-gray-700 px-2 py-1">80+ users</span>
          </div>
        </div>
      </section>

      {/* Feature Overview */}
      <section id="features" className="py-12 px-4 sm:px-6 bg-gray-900/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl sm:text-3xl font-bold text-center mb-4">
            Everything you need.
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-lg font-semibold mb-2">Preconfigured agents</h3>
              <p className="text-sm text-gray-400 mb-3">Choose from curated templates — research, support, lead gen.</p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="rounded-lg border border-gray-700 px-2 py-2">🧠 Research Agent</div>
                <div className="rounded-lg border border-gray-700 px-2 py-2">🎵 Support Agent</div>
                <div className="rounded-lg border border-gray-700 px-2 py-2">🎨 Lead Gen Agent</div>
              </div>
              <Link href="/marketplace" className="mt-3 inline-block text-sm text-lobster-400 hover:underline">Browse →</Link>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-lg font-semibold mb-2">One-click skills</h3>
              <p className="text-sm text-gray-400 mb-3">Add scraping, calendar, email and more.</p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="rounded-lg border border-gray-700 px-2 py-2 flex justify-between"><span>Web Scraping</span><span className="text-green-400">✓</span></div>
                <div className="rounded-lg border border-gray-700 px-2 py-2 flex justify-between"><span>Email</span><span className="text-green-400">✓</span></div>
                <div className="rounded-lg border border-gray-700 px-2 py-2 flex justify-between"><span>Calendar</span><span className="text-lobster-400">+</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl sm:text-3xl font-bold text-center mb-4">Chat with your agent</h2>
          <p className="text-center text-gray-400 mb-8 text-sm sm:text-base">Use Telegram, Discord, or WhatsApp.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <div className="text-xs text-gray-500 mb-2">TELEGRAM</div>
              <div className="rounded-lg border border-gray-700 p-3 text-xs sm:text-sm text-gray-300 mb-2">Scrape top 10 "AI agents"</div>
              <div className="rounded-lg border border-gray-700 p-3 text-xs sm:text-sm text-gray-300 mb-2">On it... Done!</div>
              <div className="rounded-lg border border-gray-700 p-3 text-xs sm:text-sm text-gray-300">Saved to results.csv</div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-lg font-semibold mb-2">Connect accounts</h3>
              <p className="text-sm text-gray-400 mb-3">Link Google, GitHub, Slack and more.</p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="rounded-lg border border-gray-700 px-2 py-2 flex justify-between"><span>Google</span><span className="text-green-400">✓</span></div>
                <div className="rounded-lg border border-gray-700 px-2 py-2 flex justify-between"><span>GitHub</span><span className="text-green-400">✓</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 px-4 sm:px-6 bg-gray-900/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl sm:text-3xl font-bold text-center mb-4">Three steps</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: '1', title: 'Choose template', description: 'Pick research, support, or start blank.' },
              { step: '2', title: 'Connect channel', description: 'Link Telegram, Discord, or WhatsApp.' },
              { step: '3', title: 'Click Deploy', description: 'Your agent launches in 60 seconds.' }
            ].map((item) => (
              <div key={item.step} className="relative bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-lobster-500 rounded-full flex items-center justify-center font-bold text-sm">{item.step}</div>
                <h3 className="text-base font-semibold mb-1 mt-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl sm:text-3xl font-bold text-center mb-2">
            Simple Pricing
          </h2>
          <p className="text-center text-gray-400 mb-8 text-sm">
            3-day free trial.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-lg font-semibold">Free</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">£0</span>
                <span className="text-gray-400 text-sm"> / 3 days</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-gray-400">
                <li className="flex items-center gap-2">✓ Full access</li>
                <li className="flex items-center gap-2">✓ Free AI</li>
                <li className="flex items-center gap-2">✓ Telegram</li>
              </ul>
              <Link href="/onboard" className="mt-4 block w-full rounded-lg bg-gray-800 py-2 text-center text-sm font-semibold hover:bg-gray-700">
                Try Free
              </Link>
            </div>
            
            {/* Starter */}
            <div className="bg-gray-900 rounded-xl p-5 border-2 border-lobster-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lobster-500 px-3 py-1 rounded-full text-xs font-semibold">
                Popular
              </div>
              <h3 className="text-lg font-semibold">Starter</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">£29</span>
                <span className="text-gray-400 text-sm"> /mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-gray-400">
                <li className="flex items-center gap-2">✓ Everything in Free</li>
                <li className="flex items-center gap-2">✓ Your AI key</li>
                <li className="flex items-center gap-2">✓ Priority support</li>
              </ul>
              <Link href="/api/stripe/checkout?plan=starter" className="mt-4 block w-full rounded-lg bg-lobster-500 py-2 text-center text-sm font-semibold hover:bg-lobster-400">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">£49</span>
                <span className="text-gray-400 text-sm"> /mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-gray-400">
                <li className="flex items-center gap-2">✓ 2x resources</li>
                <li className="flex items-center gap-2">✓ Custom domain</li>
                <li className="flex items-center gap-2">✓ WhatsApp</li>
              </ul>
              <Link href="/api/stripe/checkout?plan=pro" className="mt-4 block w-full rounded-lg bg-gray-800 py-2 text-center text-sm font-semibold hover:bg-gray-700">
                Go Pro
              </Link>
            </div>

            {/* Done-For-You */}
            <div className="bg-gray-900 rounded-xl p-5 border border-lobster-500">
              <h3 className="text-lg font-semibold">Done-For-You</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">£1,200</span>
                <span className="text-gray-400 text-sm"> one-time</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-gray-400">
                <li className="flex items-center gap-2">✓ Full setup</li>
                <li className="flex items-center gap-2">✓ 3 months Pro</li>
                <li className="flex items-center gap-2">✓ Custom build</li>
              </ul>
              <Link href="/api/stripe/checkout?plan=dfy" className="mt-4 block w-full rounded-lg bg-lobster-500 py-2 text-center text-sm font-semibold hover:bg-lobster-400">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 text-sm text-gray-400">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="/docs" className="hover:text-white">Docs</a>
            <a href="/marketplace" className="hover:text-white">Marketplace</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
          </div>
          <p className="text-gray-500">© 2026 Agentbot</p>
        </div>
      </footer>
    </main>
  )
}
