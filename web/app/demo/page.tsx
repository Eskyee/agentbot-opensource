import { Metadata } from 'next'
import { PageHero } from '@/app/components/PageHero'
import { formatPublicCount, getPublicPlatformStats } from '@/app/lib/public-platform-stats'
import { DemoChat } from './components/DemoChat'

export const metadata: Metadata = {
  title: 'Demo — Agentbot',
  description: 'Try Agentbot live. Chat with an AI agent powered by MiMo V2.5 Pro — no signup required.',
}

export const dynamic = 'force-dynamic'

const demoTemplateCount = 4

export default async function DemoPage() {
  const stats = await getPublicPlatformStats(demoTemplateCount)

  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero
        label="Demo"
        title="Try It"
        highlight="Live"
        description="Chat with an Agentbot agent right now. Powered by MiMo V2.5 Pro. No signup, no API key, no friction."
        gradient="amber"
      />

      {/* Stats */}
      <section className="border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Deployed Agents</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.totalAgents)}</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Live Agents</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.liveAgents)}</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Showcase Ready</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.showcaseAgents)}</div>
            </div>
            <div className="border border-zinc-800 bg-zinc-950/40 px-4 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Skills Installed</div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{formatPublicCount(stats.installedSkills)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chat Demo */}
      <section className="border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Live Demo</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-3">
              Chat with <span className="text-amber-500">Agentbot</span>
            </h2>
            <p className="text-sm text-zinc-400">
              This is a real Agentbot agent running on MiMo V2.5 Pro. Ask it anything — it can search the web, 
              explain code, help with business tasks, and more. 10 free messages, no signup required.
            </p>
          </div>

          <DemoChat />

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500 mb-4">
              Want your own agent? Deploy one in 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                Deploy Your Agent →
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center border border-zinc-800 px-8 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-900">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">How It Works</div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tighter uppercase mb-10">
            From zero to agent in <span className="text-amber-500">2 minutes</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your account. Free plan available with your own MiMo key.' },
              { step: '02', title: 'Configure', desc: 'Choose your agent type, AI model, skills, and connect a channel.' },
              { step: '03', title: 'Deploy', desc: 'Your agent goes live. Runs 24/7. Talk to it on Telegram, Discord, WhatsApp, or X.' },
            ].map((item) => (
              <div key={item.step} className="border border-zinc-800 p-6">
                <div className="text-amber-500 text-xs font-mono mb-3">{item.step}</div>
                <h3 className="font-bold uppercase tracking-wider text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
