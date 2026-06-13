'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

const SandpackWorkbench = dynamic(() => import('@/app/playground/SandpackWorkbench'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[480px] items-center justify-center bg-black text-[10px] uppercase tracking-widest text-zinc-600">
      Booting preview…
    </div>
  ),
})

type SharedFile = { path: string; language: string; content: string }

export function SharedAppView({
  id,
  title,
  summary,
  files,
  publishedUrl,
}: {
  id: string
  title: string
  summary: string
  files: SharedFile[]
  publishedUrl: string | null
}) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview')

  return (
    <main className="min-h-screen bg-black font-mono text-white">
      {/* Header */}
      <div className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/playground" className="text-[11px] font-bold uppercase tracking-widest hover:text-orange-500">
            ◈ Agentbot Playground
          </Link>
          <div className="flex items-center gap-2">
            {publishedUrl && (
              <a
                href={publishedUrl.startsWith('http') ? publishedUrl : `https://${publishedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-zinc-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
              >
                Open live ↗
              </a>
            )}
            <Link
              href={`/playground?remix=${id}`}
              className="bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
            >
              Remix
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-widest text-orange-500">Built with Agentbot</div>
          <h1 className="mt-2 text-2xl font-bold uppercase tracking-tighter sm:text-3xl">{title}</h1>
          {summary && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{summary}</p>}
        </div>

        {/* Preview / Code toggle */}
        <div className="mb-3 flex items-center gap-1">
          {(['preview', 'code'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex h-8 items-center gap-2 border px-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                tab === t ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="h-[560px] border border-zinc-900 bg-zinc-950">
          <SandpackWorkbench generationKey={`share-${id}`} files={files} mode={tab} />
        </div>

        {/* CTA */}
        <div className="mt-8 border border-zinc-900 bg-zinc-950 p-6 text-center">
          <h2 className="text-xl font-bold uppercase tracking-tighter">Build your own in seconds</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Describe an app, watch it stream into a live preview, edit it, and publish — free, on the
            Agentbot Playground.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href={`/playground?remix=${id}`} className="bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200">
              Remix this app →
            </Link>
            <Link href="/playground" className="border border-zinc-800 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white">
              Start from scratch
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
