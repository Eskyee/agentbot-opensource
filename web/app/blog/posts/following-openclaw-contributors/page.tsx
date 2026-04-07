import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Following the OpenClaw Contributors — Agentbot',
  description: 'We followed all 102 OpenClaw contributors. Here\'s why this matters for the AI agent ecosystem.',
  keywords: ['Agentbot', 'OpenClaw', 'contributors', 'community', 'AI agents'],
  openGraph: {
    title: 'Following the OpenClaw Contributors',
    description: 'We followed all 102 OpenClaw contributors. Here\'s why.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/following-openclaw-contributors',
  },
}

export default function FollowingOpenClawContributors() {
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
              Following the OpenClaw Contributors
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Community</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenClaw</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Contributors</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            Just followed all <strong className="text-white">102 OpenClaw contributors</strong> on GitHub.
            It took a bit of time, but it&apos;s worth it.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Why Follow 102 People?
          </h2>
          <p className="text-zinc-300 mb-4">
            OpenClaw v2026.4.5 dropped yesterday with video generation, music generation, ComfyUI integration,
            new providers, multilingual Control UI, and more. That&apos;s not the work of one person — it&apos;s
            the collective effort of a community.
          </p>
          <p className="text-zinc-300 mb-4">
            By following the contributors, you get:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li>Early access to features they&apos;re working on</li>
            <li>Visibility into the direction of OpenClaw</li>
            <li>Connection to the people building the future of AI agents</li>
            <li>Potential collaborations and knowledge sharing</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            The Contributors
          </h2>
          <p className="text-zinc-300 mb-4">
            A huge shoutout to the people making OpenClaw happen. Notable contributors include:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-1">
            <li><strong className="text-white">@steipete</strong> — Project maintainer</li>
            <li><strong className="text-white">@vincentkoc</strong> — Major contributor across memory, prompting, Control UI</li>
            <li><strong className="text-white">@jlapenna</strong> — Device pairing security</li>
            <li><strong className="text-white">@vignesh07</strong> — Memory/dreaming features</li>
            <li><strong className="text-white">@gumadeiras</strong> — Matrix integrations</li>
            <li><strong className="text-white">@obviyus</strong> — Mobile and Android features</li>
            <li><strong className="text-white">@mbelinky</strong> — Gateway and Lobster plugin</li>
            <li><strong className="text-white">@openperf</strong> — Agent runtime improvements</li>
            <li><strong className="text-white">@wirjo</strong> — Amazon Bedrock Mantle</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            And 93 more. Every commit counts.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What v2026.4.5 Means for Agentbot
          </h2>
          <p className="text-zinc-300 mb-4">
            This release brings production-ready features we can leverage:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Video generation</strong> — Agents can create videos directly</li>
            <li><strong className="text-white">Music generation</strong> — Audio synthesis via Lyria and MiniMax</li>
            <li><strong className="text-white">ComfyUI</strong> — Custom workflow automation</li>
            <li><strong className="text-white">New providers</strong> — Qwen, Fireworks, Bedrock Mantle</li>
            <li><strong className="text-white">Multilingual UI</strong> — 13 languages supported</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Building on Their Work
          </h2>
          <p className="text-zinc-300 mb-4">
            We run OpenClaw at scale on Agentbot. Every update they ship flows through our infrastructure.
            By following the contributors, we stay ahead of changes, understand the roadmap, and can
            contribute back.
          </p>
          <p className="text-zinc-300 mb-4">
            If you&apos;re building on OpenClaw or running agents in production, consider following the
            contributors too. It&apos;s a small investment that pays off in awareness and connection.
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8">
            <p className="text-zinc-400 text-sm">
              Check out the full contributor list:{' '}
              <a href="https://github.com/open-chat-ai/openclaw/graphs/contributors" className="text-blue-400 hover:underline">
                github.com/open-chat-ai/openclaw/graphs/contributors
              </a>
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}