import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Open-Source Catch-Up and Agentbot Coach',
  description: 'Refreshed SDK, community documentation, and the launch of Agentbot Coach for autonomous onboarding.',
  keywords: ['Open Source', 'Coach', 'Onboarding', 'SDK'],
}

export default function OpenSourceCoach() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        <article className="prose prose-invert max-w-none">
          <p className="text-sm text-zinc-500 mb-2">17 April 2026</p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter mb-8">Open-Source Catch-Up & Coach</h1>
          <p className="text-zinc-300 mb-6">We have unified the OpenClaw and Agentbot documentation surfaces and released the new Agentbot Coach — an interactive guide that helps new operators deploy their first fleet in minutes.</p>
          <p className="text-zinc-300">The community token integration is also now fully reflected in the open-source repos, ensuring transparency for all contributors.</p>
        </article>
      </div>
    </main>
  )
}
