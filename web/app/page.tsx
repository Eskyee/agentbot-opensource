import Link from 'next/link'
import { getPublicPricing } from './lib/stripe-pricing'
// import { neon } from '@neondatabase/serverless';

export const revalidate = 300

export default async function Home() {
  const pricing = await getPublicPricing()

  // Removed form handling logic

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(249,115,22,0.12),transparent)]" />
        
        <div className="mx-auto max-w-4xl text-center">
          {/* Lobster emoji */}
          <div className="mb-8 text-7xl animate-float">🦞</div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block">OpenClaw Deploy - Deploy OpenClaw in 60 Seconds</span>
            <span className="block text-lg text-lobster-400 mt-2">Built by Agentbot</span>
          </h1>
          
          <p className="mt-6 text-base leading-7 text-gray-400 sm:text-xl sm:leading-8">
            <span className="block">Deploy your OpenClaw agent in under 2 minutes</span>
            <span className="block">Chat via Telegram, Discord, or WhatsApp</span>
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Credits included -- no API keys needed
          </p>
          
          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-x-6">
            <Link
              href="/signup"
              className="rounded-full bg-gray-900 px-8 py-4 text-center text-lg font-semibold text-white shadow-lg hover:bg-gray-700 transition-all"
            >
              Deploy your OpenClaw agent
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-gray-700 px-8 py-4 text-center text-lg font-semibold text-gray-200 hover:border-lobster-500 hover:text-lobster-300 transition-all"
            >
              View Docs
            </Link>
            <Link href="#how-it-works" className="text-center text-lg font-semibold leading-6 text-gray-300 hover:text-white sm:text-left">
              Watch the demo <span aria-hidden="true">→</span>
            </Link>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <span className="rounded-full border border-gray-700 px-3 py-1">You control your keys</span>
            <span className="rounded-full border border-gray-700 px-3 py-1">80+ signed-up users</span>
            <span className="rounded-full border border-gray-700 px-3 py-1">Posted by raveculture baseFM</span>
          </div>
        </div>
      </section>

      {/* Feature Overview */}
      <section id="features" className="py-24 px-6 bg-gray-900/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-center text-gray-400 mb-16">
            Preconfigured agents, one-click skills, and chat-first automation.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-2">Preconfigured agents save hours</h3>
              <p className="text-gray-400 mb-4">Choose from curated templates — research, support, lead gen — with the right skills pre-installed.</p>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border border-gray-700 px-3 py-2"><strong>G</strong> globe — Research Agent</div>
                <div className="rounded-lg border border-gray-700 px-3 py-2"><strong>M</strong> muso — Support Agent</div>
                <div className="rounded-lg border border-gray-700 px-3 py-2"><strong>S</strong> studio — Lead Gen Agent</div>
              </div>
              <Link href="/marketplace" className="mt-4 inline-block text-lobster-400 hover:underline">Choose a template →</Link>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-2">Install skills in one click</h3>
              <p className="text-gray-400 mb-4">Add scraping, calendar sync, email handling and more from your dashboard.</p>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border border-gray-700 px-3 py-2 flex justify-between"><span>Web Scraping</span><span className="text-green-400">Installed</span></div>
                <div className="rounded-lg border border-gray-700 px-3 py-2 flex justify-between"><span>Email Management</span><span className="text-green-400">Installed</span></div>
                <div className="rounded-lg border border-gray-700 px-3 py-2 flex justify-between"><span>Calendar Sync</span><span className="text-lobster-400">Install</span></div>
                <div className="rounded-lg border border-gray-700 px-3 py-2 flex justify-between"><span>File Handling</span><span className="text-lobster-400">Install</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">Chat like you would with a colleague</h2>
          <p className="text-center text-gray-400 mb-12">Use Telegram, Discord, or WhatsApp. Send tasks, get updates, receive files.</p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="text-xs text-gray-500 mb-2">TELEGRAM</div>
              <div className="rounded-lg border border-gray-700 p-3 text-sm text-gray-300 mb-2">Scrape the top 10 results for "AI agents"</div>
              <div className="rounded-lg border border-gray-700 p-3 text-sm text-gray-300 mb-2">On it. Scraping Google now...</div>
              <div className="rounded-lg border border-gray-700 p-3 text-sm text-gray-300">Done — 10 results saved to results.csv. Want me to email it?</div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-2">Connect accounts instantly</h3>
              <p className="text-gray-400 mb-4">Sign in with Google, link your services, and let your agent access the tools you need.</p>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border border-gray-700 px-3 py-2 flex justify-between"><span>● Google</span><span className="text-green-400">Connected</span></div>
                <div className="rounded-lg border border-gray-700 px-3 py-2 flex justify-between"><span>● GitHub</span><span className="text-green-400">Connected</span></div>
                <div className="rounded-lg border border-gray-700 px-3 py-2 flex justify-between"><span>○ Slack</span><span className="text-lobster-400">Connect</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-900/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-4">Three steps. Under a minute.</h2>
          <p className="text-center text-gray-400 mb-16">No servers to configure. No DevOps required.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose your agent template', description: 'Pick curated presets — research, support, lead gen — or start blank.' },
              { step: '2', title: 'Connect a messaging channel', description: 'Link Telegram, Discord, or WhatsApp in one quick setup.' },
              { step: '3', title: 'Click Deploy', description: 'Your agent launches in under 60 seconds and is ready to chat.' }
            ].map((item) => (
              <div key={item.step} className="relative bg-gray-900 rounded-2xl p-8 border border-gray-800">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-lobster-500 rounded-full flex items-center justify-center font-bold text-lg">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2 mt-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400">Trusted by builders • 15–20 users running agents right now</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-16">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-gray-400 -mt-10 mb-12">
            3-day free trial. Deploy first, pay later.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-xl font-semibold">Free Trial</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">£0</span>
                <span className="text-gray-400"> / 3 days</span>
              </div>
              <ul className="mt-8 space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Full OpenClaw access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Free AI (Groq)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Telegram integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> No upfront payment
                </li>
              </ul>
              <Link href="/onboard" className="mt-8 block w-full rounded-lg bg-gray-800 py-3 text-center font-semibold hover:bg-gray-700 transition-colors">
                Start Free Trial
              </Link>
            </div>
            
            {/* Starter */}
            <div className="bg-gray-900 rounded-2xl p-8 border-2 border-lobster-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lobster-500 px-3 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold">Starter</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">£29</span>
                <span className="text-gray-400"> / month (GBP)</span>
              </div>
              <ul className="mt-8 space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Bring your own AI key
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Daily backups
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Priority support
                </li>
              </ul>
              <Link href="/api/stripe/checkout?plan=starter" className="mt-8 block w-full rounded-lg bg-lobster-500 py-3 text-center font-semibold hover:bg-lobster-400 transition-colors">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-xl font-semibold">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">£49</span>
                <span className="text-gray-400"> / month (GBP)</span>
              </div>
              <ul className="mt-8 space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Everything in Starter
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 2x resources
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Custom domain
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> WhatsApp support
                </li>
              </ul>
              <Link href="/api/stripe/checkout?plan=pro" className="mt-8 block w-full rounded-lg bg-gray-800 py-3 text-center font-semibold hover:bg-gray-700 transition-colors">
                Go Pro
              </Link>
            </div>

            {/* Done-For-You */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-lobster-500">
              <h3 className="text-xl font-semibold">Done-For-You</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">£1,200</span>
                <span className="text-gray-400"> one-time (GBP)</span>
              </div>
              <ul className="mt-8 space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Full white-glove configuration
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 3 months of Pro plan included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> £240 in AI credits included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Custom integrations & workflows
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Dedicated onboarding support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Priority bug fixes & tuning
                </li>
              </ul>
              <Link href="/api/stripe/checkout?plan=dfy" className="mt-8 block w-full rounded-lg bg-lobster-500 py-3 text-center font-semibold hover:bg-lobster-400 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 text-sm text-gray-400">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="/marketplace" className="hover:text-white transition-colors">Marketplace</a>
            <a href="/docs" className="hover:text-white transition-colors">View Docs</a>
            <a href="/blog" className="hover:text-white transition-colors">Blog</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-gray-500">© 2026 OpenClawDeploy</p>
        </div>
      </footer>
    </main>
  )
}
