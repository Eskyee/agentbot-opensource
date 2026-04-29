import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Factory AI Unification: Identity, Execution, and State',
  description: '100% Railway migration, DID-native cryptographic signatures, durable workflow execution, and state mirroring to Gitlawb.',
  keywords: ['Architecture', 'Identity', 'Security', 'Railway', 'Gitlawb'],
}

export default function FactoryAIUnification() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        <article className="prose prose-invert max-w-none">
          <p className="text-sm text-zinc-500 mb-2">23 April 2026</p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-8">The Factory AI Unification</h1>
          <p className="text-zinc-300 mb-6">The "Fact-Based Backend" is now live. We have completed our migration to a fully unified stack on Railway, integrating DID-native cryptographic signatures and state mirroring via Gitlawb.</p>
          <p className="text-zinc-300">This architectural shift ensures that every action taken by an agent is verifiable, immutable, and persistent across the entire network.</p>
        </article>
      </div>
    </main>
  )
}
