import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Agent Jobs Board is Live — Agentbot',
  description: 'A jobs board dedicated to AI agent developers, builders, and operators. Post jobs, find talent, build the future.',
  keywords: ['AI jobs', 'agent jobs', 'AI agent hiring', 'jobs board', 'hiring'],
  openGraph: {
    title: 'AI Agent Jobs Board is Live',
    description: 'A jobs board dedicated to AI agent developers and builders.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/ai-agent-jobs-board-live',
  },
}

export default function AIAgentJobsBoardLive() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">7 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              AI Agent Jobs Board is Live
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Feature</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Jobs</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Beta</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            We launched an <strong className="text-white">AI Agent Jobs Board</strong> — a place for companies 
            building AI agents to find talent, and for developers to find roles in the space.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Why a Dedicated Jobs Board?
          </h2>
          <p className="text-zinc-300 mb-4">
            The AI agent space is moving fast. Traditional job boards don&apos;t capture the specific skills 
            needed — orchestration, tool calling, multi-agent systems, OpenClaw expertise.
          </p>
          <p className="text-zinc-300 mb-4">
            This board is for:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li>Companies building agent platforms</li>
            <li>Teams integrating AI into workflows</li>
            <li>Researchers working on autonomous systems</li>
            <li>Developers who want to specialize in agent tech</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Features
          </h2>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Role filters</strong> — Frontend, Backend, Fullstack, DevOps, AI/ML</li>
            <li><strong className="text-white">Seniority</strong> — Junior, Mid, Senior, Staff, Lead</li>
            <li><strong className="text-white">Tech type</strong> — Web2, Web3, or both</li>
            <li><strong className="text-white">Salary visibility</strong> — Transparent ranges in USD/USDC</li>
            <li><strong className="text-white">Apply links</strong> — Direct to company ATS or application form</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Beta
          </h2>
          <p className="text-zinc-300 mb-4">
            We&apos;re in beta — iterating fast based on feedback. If you&apos;re hiring for agent roles, 
            post a job. If you&apos;re looking, browse and apply.
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8">
            <Link 
              href="/jobs"
              className="inline-block bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Browse Jobs →
            </Link>
            <p className="text-zinc-400 text-sm mt-4">
              or <a href="/jobs#post" className="text-blue-400 hover:text-white">post a job →
            </a>
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}