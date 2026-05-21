import Link from 'next/link'
import {
  creatorSoundpacks,
  creatorToolkitPositioning,
  launchRoadmap,
  marketplaceTracks,
  masterCreatorSystemPrompt,
  producerAgents,
  soundpackBlueprint,
  toolkitPrompts,
} from '@/app/lib/creator-toolkit'
import { RaveTerminalPanel } from '@/app/components/RaveTerminalPanel'

const visualSignals = ['black', 'cyan', 'magenta', 'acid green', 'CRT noise', 'pirate radio', 'warehouse pressure']

export default function CreatorToolkitPage() {
  const featuredPrompts = toolkitPrompts.filter((prompt) =>
    ['Arrangement', 'Sound Design', 'baseFM', 'Visual', 'Positioning'].includes(prompt.category),
  )

  return (
    <main className="min-h-screen bg-black text-white font-mono selection:bg-cyan-400/20">
      <section className="border-b border-zinc-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <div>
            <div className="mb-6 inline-flex border border-cyan-400/30 px-3 py-1 text-[10px] uppercase tracking-widest text-cyan-300">
              Underground AI Creator Toolkit
            </div>
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-tighter sm:text-6xl lg:text-7xl">
              Pirate radio meets producer agents.
            </h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-zinc-400">
              A high-contrast creator system for jungle, neuro DnB, warehouse techno, psytrance,
              visual drops, baseFM programming, and autonomous release workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/creator"
                className="bg-white px-5 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
              >
                Open Creator Console
              </Link>
              <Link
                href="/api/creator-toolkit/soundpack"
                className="border border-zinc-800 px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-cyan-400 hover:text-white"
              >
                Soundpack Manifest
              </Link>
            </div>
          </div>

          <aside className="grid gap-5">
            <RaveTerminalPanel />
            <div className="border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="mb-4 text-[10px] uppercase tracking-widest text-zinc-500">Master System Prompt</div>
              <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap text-xs leading-6 text-zinc-300">
                {masterCreatorSystemPrompt}
              </pre>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Identity</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter sm:text-4xl">
              High-contrast culture layer.
            </h2>
          </div>
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-7">
            {visualSignals.map((signal) => (
              <div key={signal} className="bg-black p-5 text-xs uppercase tracking-widest text-zinc-300">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6">
          <div className="mb-10 max-w-3xl">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Producer Agents</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter sm:text-4xl">
              Agents for arrangement, low-end, psy signals, and radio.
            </h2>
          </div>
          <div className="grid gap-px bg-zinc-900 md:grid-cols-2 lg:grid-cols-4">
            {producerAgents.map((agent) => (
              <article key={agent.id} className="bg-black p-6">
                <div className="mb-4 text-[10px] uppercase tracking-widest text-cyan-300">{agent.bpm}</div>
                <h3 className="text-lg font-bold uppercase tracking-tight">{agent.name}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{agent.role}</p>
                <p className="mt-5 border-t border-zinc-900 pt-5 text-xs leading-5 text-zinc-400">{agent.output}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Soundpack</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter sm:text-4xl">{soundpackBlueprint.title}</h2>
            <p className="mt-5 text-sm leading-7 text-zinc-500">
              {soundpackBlueprint.tempoRange}. {soundpackBlueprint.keyCenter}. {soundpackBlueprint.license}.
            </p>
          </div>
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
            {creatorSoundpacks.map((pack) => (
              <article key={pack.slug} className="bg-black p-5">
                <div className="mb-3 text-[10px] uppercase tracking-widest text-cyan-300">{pack.family} · {pack.bpm} BPM</div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">{pack.title}</h3>
                <p className="mt-3 text-xs leading-6 text-zinc-500">{pack.signal}</p>
              </article>
            ))}
            {soundpackBlueprint.folders.map((folder) => (
              <article key={folder.path} className="bg-black p-5">
                <h3 className="text-sm font-bold text-white">{folder.path}</h3>
                <p className="mt-3 text-xs leading-6 text-zinc-500">{folder.contents.join(' / ')}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6">
          <div className="mb-10 max-w-3xl">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Prompt Library</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter sm:text-4xl">
              Ready-to-run creator prompts.
            </h2>
          </div>
          <div className="grid gap-px bg-zinc-900 md:grid-cols-2 lg:grid-cols-3">
            {featuredPrompts.map((prompt) => (
              <article key={prompt.id} className="bg-black p-5">
                <div className="mb-3 text-[10px] uppercase tracking-widest text-magenta-300">{prompt.category}</div>
                <h3 className="text-sm font-bold uppercase tracking-wider">{prompt.title}</h3>
                <p className="mt-3 text-xs leading-6 text-zinc-500">{prompt.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Launch Roadmap</div>
            <ol className="grid gap-px bg-zinc-900">
              {launchRoadmap.map((item, index) => (
                <li key={item} className="grid grid-cols-[54px_1fr] bg-black text-sm text-zinc-300">
                  <span className="border-r border-zinc-900 p-4 text-zinc-600">{String(index + 1).padStart(2, '0')}</span>
                  <span className="p-4">{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <aside className="border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Marketplace</div>
            <div className="grid gap-3">
              {marketplaceTracks.map((track) => (
                <div key={track} className="border border-zinc-900 p-3 text-xs uppercase tracking-widest text-zinc-300">
                  {track}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-cyan-300">{creatorToolkitPositioning}</p>
          </aside>
        </div>
      </section>
    </main>
  )
}
