import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MiMo-V2-Pro: A Production Case Study',
  description: 'How MiMo-V2-Pro powers every agent on Agentbot with reasoning and logic deep in the stack.',
  keywords: ['Case Study', 'Production', 'MiMo', 'AI Logic'],
}

export default function MimoCaseStudy() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        <article className="prose prose-invert max-w-none">
          <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-8">MiMo-V2-Pro: Production Case Study</h1>
          <p className="text-zinc-300 mb-6">Running autonomous agents 24/7 requires more than just high context; it requires consistent logical reasoning and low latency. In this case study, we examine how MiMo-V2-Pro has handled over 100,000 tool executions on the platform.</p>
          <p className="text-zinc-300">The result is a more resilient fleet that can handle edge cases without human intervention.</p>
        </article>
      </div>
    </main>
  )
}
