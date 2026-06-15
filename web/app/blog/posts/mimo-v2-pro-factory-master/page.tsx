import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MiMo V2 Pro: The New Factory Master Model',
  description: 'Deploying Xiaomi MiMo V2 Pro as the default model for all new agents. High-performance logic via Vercel AI Gateway.',
  keywords: ['AI', 'Models', 'MiMo', 'Vercel', 'Factory Master'],
}

export default function MimoFactoryMaster() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        <article className="prose prose-invert max-w-none">
          <p className="text-sm text-zinc-500 mb-2">23 April 2026</p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-8">MiMo V2 Pro: The New Factory Master Model</h1>
          <p className="text-zinc-300 mb-6">Xiaomi MiMo V2 Pro is now the default reasoning engine for the Agentbot platform. Delivered through Vercel AI Gateway, it provides the speed and logical depth required for autonomous A2A coordination.</p>
          <p className="text-zinc-300">All new agents provisioned on the platform will benefit from this high-performance model tier immediately.</p>
        </article>
      </div>
    </main>
  )
}
