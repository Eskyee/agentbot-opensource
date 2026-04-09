import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot Update — OpenClaw v2026.4.5',
  description: 'OpenClaw v2026.4.5 is out. Video generation, music generation, new providers (Qwen, Fireworks, MiniMax, Bedrock Mantle), multilingual Control UI, and more.',
  keywords: ['Agentbot', 'OpenClaw', '2026.4.5', 'video generation', 'music generation', 'update'],
  openGraph: {
    title: 'Agentbot Update — OpenClaw v2026.4.5',
    description: 'Video generation, music generation, new providers, multilingual Control UI. All live.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/openclaw-v2026-4-5',
  },
}

export default function OpenClawV202645() {
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
              OpenClaw v2026.4.5
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Release</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenClaw</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Video</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Music</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            v2026.4.5 dropped yesterday with some major features. Video generation, music generation,
            bundled ComfyUI support, new providers, and a multilingual Control UI. Here&apos;s the highlights.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Video Generation
          </h2>
          <p className="text-zinc-300 mb-4">
            Built-in <code className="text-zinc-200">video_generate</code> tool lets agents create videos
            through configured providers and return the generated media directly in the reply. Bundled providers
            include xAI (grok-imagine-video), Alibaba Model Studio Wan, and Runway.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Music Generation
          </h2>
          <p className="text-zinc-300 mb-4">
            New <code className="text-zinc-200">music_generate</code> tool with bundled Google Lyria and MiniMax
            providers plus workflow-backed Comfy support. Includes async task tracking and follow-up delivery
            of finished audio.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            ComfyUI Integration
          </h2>
          <p className="text-zinc-300 mb-4">
            Bundled ComfyUI workflow media plugin for local ComfyUI and Comfy Cloud workflows. Includes
            shared image_generate, video_generate, and workflow-backed music_generate support with prompt
            injection, optional reference-image upload, live tests, and output download.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            New Providers
          </h2>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Qwen</strong> — bundled provider</li>
            <li><strong className="text-white">Fireworks AI</strong> — bundled provider</li>
            <li><strong className="text-white">StepFun</strong> — bundled provider</li>
            <li><strong className="text-white">MiniMax TTS</strong> — speech integration</li>
            <li><strong className="text-white">Amazon Bedrock Mantle</strong> — inference profile discovery</li>
            <li><strong className="text-white">Ollama Web Search</strong> — search integration</li>
            <li><strong className="text-white">MiniMax Search</strong> — chat and search workflows</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Multilingual Control UI
          </h2>
          <p className="text-zinc-300 mb-4">
            Control UI now supports: Simplified Chinese, Traditional Chinese, Brazilian Portuguese,
            German, Spanish, Japanese, Korean, French, Turkish, Indonesian, Polish, and Ukrainian.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Memory & Dreaming
          </h2>
          <p className="text-zinc-300 mb-4">
            Experimental features continue to ship: weighted short-term recall promotion, /dreaming command,
            Dream Diary surface, multilingual conceptual tagging, and configurable aging controls.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Breaking Changes
          </h2>
          <p className="text-zinc-300 mb-4">
            Legacy public config aliases removed (talk.voiceId, talk.apiKey, agents.*.sandbox.perSession,
            browser.ssrfPolicy.allowPrivateNetwork, hooks.internal.handlers, channel/group/room toggles).
            Use canonical paths with openclaw doctor --fix migration support for existing configs.
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8">
            <p className="text-zinc-400 text-sm">
              All Agentbot containers auto-update on deploy. Run <code className="text-zinc-200">openclaw --version</code> to verify.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}