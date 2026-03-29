import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot Now Runs OpenClaw v2026.3.28',
  description: 'Tool approval gates, xAI web search, MiniMax image generation, ACP channel binds, and 60+ fixes.',
  keywords: ['OpenClaw', 'v2026.3.28', 'update', 'release', 'agent', 'tools', 'approval'],
  openGraph: {
    title: 'Agentbot Now Runs OpenClaw v2026.3.28',
    description: 'Tool approval gates, xAI web search, MiniMax image generation, ACP channel binds, and 60+ fixes.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/openclaw-v2026-3-28',
  },
}

export default function OpenClawV2026328Post() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">29 March 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">OpenClaw v2026.3.28</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Release</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Tools</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">xAI</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Image Gen</span>
            </div>
          </div>

          <p className="text-lg text-zinc-300 mb-6">
            We&apos;ve updated Agentbot to OpenClaw v2026.3.28 — the largest release since 3.24.
            This brings <strong>tool approval gates</strong>, <strong>xAI web search</strong>,{' '}
            <strong>MiniMax image generation</strong>, ACP channel binds, and over 60 fixes
            across every major platform integration.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s New</h2>

          <div className="grid gap-4 mb-6">
            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">Tool Approval Gates</h3>
              <p className="text-zinc-400 text-sm">
                Plugins can now attach <code>requireApproval</code> to <code>before_tool_call</code> hooks,
                pausing agent tool execution until the user approves via the exec overlay, Telegram buttons,
                Discord interactions, or the <code>/approve</code> command. Agents ask before they act.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">xAI Web Search + Grok</h3>
              <p className="text-zinc-400 text-sm">
                Grok now has first-class <code>x_search</code> web search built in. The bundled xAI provider
                moves to the Responses API, and <code>x_search</code> setup is offered automatically during
                onboarding — including a model picker with the shared xAI key.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">MiniMax Image Generation</h3>
              <p className="text-zinc-400 text-sm">
                The <code>image-01</code> model is now available for generate and image-to-image editing with
                aspect ratio control. The MiniMax model catalog is trimmed to M2.7 — legacy M2, M2.1, M2.5,
                and VL-01 are removed.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">ACP Channel Binds</h3>
              <p className="text-zinc-400 text-sm">
                Discord, BlueBubbles, and iMessage now support current-conversation ACP binds.
                Run <code>/acp spawn codex --bind here</code> to turn any active chat into a
                Codex-backed workspace — no child thread needed.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">Slack File Uploads</h3>
              <p className="text-zinc-400 text-sm">
                New explicit <code>upload-file</code> action routes file uploads through the Slack upload
                transport with optional filename, title, and comment overrides. Microsoft Teams and
                Google Chat get the same unified file-send action.
              </p>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <h3 className="text-sm font-bold tracking-tighter uppercase mb-2">Podman Rootless Support</h3>
              <p className="text-zinc-400 text-sm">
                Container setup is simplified around the current rootless user. The launch helper installs
                to <code>~/.local/bin</code> and the host-CLI <code>openclaw --container &lt;name&gt;</code>{' '}
                workflow is now documented. Better for self-hosted agent setups.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Breaking Changes</h2>
          <div className="space-y-px bg-zinc-800 mb-6">
            <div className="bg-zinc-950 p-3 flex items-start gap-3">
              <div className="w-1 h-1 bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="text-sm text-zinc-400">
                <strong className="text-white">Qwen portal auth removed.</strong>{' '}
                The deprecated <code>qwen-portal-auth</code> OAuth integration is gone.
                Migrate: <code>openclaw onboard --auth-choice modelstudio-api-key</code>
              </div>
            </div>
            <div className="bg-zinc-950 p-3 flex items-start gap-3">
              <div className="w-1 h-1 bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="text-sm text-zinc-400">
                <strong className="text-white">Old config migrations dropped.</strong>{' '}
                Automatic migrations older than two months are removed. Very old legacy keys now fail
                validation instead of being rewritten — run <code>openclaw doctor</code> to fix.
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What We Updated</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="py-3 pr-4">Component</th>
                  <th className="py-3 pr-4">Old Version</th>
                  <th className="py-3">New Version</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-zinc-900">
                  <td className="py-3 pr-4">Docker agent image</td>
                  <td className="py-3 pr-4 font-mono text-zinc-500">2026.3.24</td>
                  <td className="py-3 font-mono text-white">2026.3.28</td>
                </tr>
                <tr className="border-b border-zinc-900">
                  <td className="py-3 pr-4">Backend default image</td>
                  <td className="py-3 pr-4 font-mono text-zinc-500">2026.3.24</td>
                  <td className="py-3 font-mono text-white">2026.3.28</td>
                </tr>
                <tr className="border-b border-zinc-900">
                  <td className="py-3 pr-4">Version endpoint</td>
                  <td className="py-3 pr-4 font-mono text-zinc-500">2026.3.24</td>
                  <td className="py-3 font-mono text-white">2026.3.28</td>
                </tr>
                <tr className="border-b border-zinc-900">
                  <td className="py-3 pr-4">Footer version</td>
                  <td className="py-3 pr-4 font-mono text-zinc-500">2026.3.23</td>
                  <td className="py-3 font-mono text-white">2026.3.28</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Key Fixes</h2>
          <ul className="space-y-2 text-zinc-300 text-sm mb-8">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span><strong>Rate-limit cooldowns</strong> scoped per model — one 429 no longer blocks every model on the same auth profile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span><strong>WhatsApp echo loop</strong> fixed — bot replies no longer re-enter as inbound messages in self-chat DM mode</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span><strong>Discord reconnect loop</strong> fixed — stale gateway sockets drained before fresh reconnects</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span><strong>Gemini 3.1</strong> pro, flash, and flash-lite models resolved correctly across all Google provider aliases</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span><strong>Anthropic stop reasons</strong> like <code>sensitive</code> now return structured errors instead of crashing the agent run</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">→</span>
              <span><strong>60+ additional fixes</strong> across Telegram, Feishu, Mattermost, Teams, iMessage, ACP, and plugins</span>
            </li>
          </ul>

          <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
            <p className="text-zinc-300 mb-4">
              Every OpenClaw improvement rolls out automatically to all Agentbot agents.
              No action needed — your agents are already on v2026.3.28.
            </p>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors"
              >
                Open Dashboard
              </Link>
              <Link
                href="https://github.com/openclaw/openclaw/releases/tag/v2026.3.28"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-zinc-800 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
              >
                Full Release Notes
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
